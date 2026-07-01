import { create } from 'zustand';
import axios from 'axios';
import type { Message, Source } from '../../types';
import { streamMessage, getMessages, deleteMessage as deleteMessageApi, regenerateMessageStream } from '../services/chat';
import { deleteSession } from '../services/session';
import { queryClient } from '../queryClient';
import { logError } from '../../utils/logError';

interface ChatStore {
  sessionId: string;
  messages: Message[];
  isStreaming: boolean;
  error: string | null;
  isDeleted: boolean;
  abortController: AbortController | null;
  clearError: () => void;
  resetDeleted: () => void;
  abortStream: () => void;
  connect: (sessionId: string) => Promise<void>;
  disconnect: () => void;
  sendMessage: (content: string) => Promise<void>;
  retryLastMessage: () => Promise<void>;
  sendImageMessage: (filename: string, caption?: string) => void;
  regenerateMessage: (assistantId: string) => Promise<void>;
}

const isAbortError = (e: unknown) =>
  (e instanceof DOMException && e.name === 'AbortError') || axios.isCancel(e)

const extractContent = (raw: string, _depth = 0): string => {
  if (_depth > 5) return raw
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed.content === 'string') return extractContent(parsed.content, _depth + 1)
    if (typeof parsed.answer === 'string') return extractContent(parsed.answer, _depth + 1)
    if (typeof parsed.text === 'string') return extractContent(parsed.text, _depth + 1)
    return raw
  } catch {
    const parts: string[] = []
    let i = 0
    while (i < raw.length) {
      if (raw[i] !== '{') {
        let j = i
        while (j < raw.length && raw[j] !== '{') j++
        const plainText = raw.slice(i, j)
        if (plainText) parts.push(plainText)
        i = j
        continue
      }
      let j = i + 1
      let braceDepth = 1
      while (j < raw.length && braceDepth > 0) {
        if (raw[j] === '"') {
          j++
          while (j < raw.length && raw[j] !== '"') {
            if (raw[j] === '\\') j++
            j++
          }
        } else if (raw[j] === '{') {
          braceDepth++
        } else if (raw[j] === '}') {
          braceDepth--
        }
        j++
      }
      if (braceDepth === 0) {
        try {
          const obj = JSON.parse(raw.slice(i, j))
          if (typeof obj.content === 'string') parts.push(extractContent(obj.content, _depth + 1))
          else if (typeof obj.answer === 'string') parts.push(extractContent(obj.answer, _depth + 1))
          else if (typeof obj.text === 'string') parts.push(extractContent(obj.text, _depth + 1))
        } catch {
          parts.push(raw.slice(i, j))
        }
        i = j
      } else {
        parts.push(raw.slice(i))
        break
      }
    }
    return parts.length > 0 ? parts.join('') : raw
  }
}

const streamRegistry = new Map<string, Message[]>();

const messageCache = new Map<string, Message[]>();

export const peekSessionMessages = (sessionId: string): Message[] => {
  const s = useChatStore.getState();
  if (s.sessionId === sessionId && s.messages.length > 0) return s.messages;
  return messageCache.get(sessionId) ?? [];
};

const CACHE_KEY = (id: string) => `rokm_cache_${id}`

const saveCache = (sessionId: string, messages: Message[]) => {
  if (!sessionId || messages.length === 0) return
  try {
    const cacheable = messages.filter(
      (m) => !(m.type === 'text' && m.role === 'assistant' && m.status === 'streaming')
    )
    if (cacheable.length > 0)
      sessionStorage.setItem(CACHE_KEY(sessionId), JSON.stringify(cacheable))
  } catch (e) { logError('saveCache', e) }
}

const loadCache = (sessionId: string): Message[] => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY(sessionId))
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    logError('loadCache', e)
    return []
  }
}

export const clearCache = (sessionId: string) => {
  messageCache.delete(sessionId)
  try { sessionStorage.removeItem(CACHE_KEY(sessionId)) } catch (e) { logError('clearCache', e) }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    const { sessionId, messages } = useChatStore.getState()
    saveCache(sessionId, messages)
  })
}

const INFLIGHT_KEY = 'rokm_inflight'

export const saveInflight = (sessionId: string, question: string) =>
  localStorage.setItem(INFLIGHT_KEY, JSON.stringify({ sessionId, question }))

export const clearInflight = (sessionId: string) => {
  try {
    const raw = localStorage.getItem(INFLIGHT_KEY)
    if (!raw) return
    if (JSON.parse(raw).sessionId === sessionId) localStorage.removeItem(INFLIGHT_KEY)
  } catch (e) { logError('clearInflight', e) }
}

const getInflight = (sessionId: string): string | null => {
  try {
    const raw = localStorage.getItem(INFLIGHT_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    return data.sessionId === sessionId ? data.question : null
  } catch (e) {
    logError('getInflight', e)
    return null
  }
}

export const useChatStore = create<ChatStore>((set, get) => {
  let connectAbortController = new AbortController();

  // 스트리밍 토큰을 모아서(throttle ~60ms) 재렌더 횟수를 줄이고,
  // 사용자가 텍스트를 선택(드래그)하는 동안엔 업데이트를 잠시 멈춰 복사가 가능하게 한다.
  // 일반 전송/재생성 스트리밍이 동일한 in-place 갱신 로직을 쓰므로 공유한다.
  const createWriter = (sessionId: string, assistantId: string) => {
    let buffer = ''
    let flushTimer: ReturnType<typeof setTimeout> | null = null
    const applyChunk = (chunk: string) => {
      if (get().sessionId !== sessionId) {
        const reg = streamRegistry.get(sessionId)
        if (reg) {
          streamRegistry.set(sessionId, reg.map((m) =>
            m.id === assistantId && m.type === 'text' ? { ...m, content: m.content + chunk } : m
          ))
        }
        return
      }
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === assistantId && m.type === 'text' ? { ...m, content: m.content + chunk } : m
        ),
      }))
      streamRegistry.set(sessionId, get().messages)
    }
    const flush = () => {
      flushTimer = null
      if (!buffer) return
      const sel = typeof window !== 'undefined' ? window.getSelection() : null
      if (sel && !sel.isCollapsed && sel.toString().length > 0) {
        // 선택 중 → 업데이트 보류 후 재시도
        flushTimer = setTimeout(flush, 250)
        return
      }
      const chunk = buffer
      buffer = ''
      applyChunk(chunk)
    }
    return {
      push: (chunk: string) => {
        buffer += chunk
        if (!flushTimer) flushTimer = setTimeout(flush, 60)
      },
      flushNow: () => {
        if (flushTimer) { clearTimeout(flushTimer); flushTimer = null }
        if (buffer) { const c = buffer; buffer = ''; applyChunk(c) }
      },
      setSources: (sources: Source[]) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantId && m.type === 'text' ? { ...m, sources } : m
          ),
        }))
      },
    }
  }

  // 빈/실패 응답 후 백엔드에 남은 잔여물(방금 보낸 질문 + 빈 AI 답변)을 정리한다.
  // 꼬리(가장 최근)만 본다: 마지막이 빈 ai면 삭제, 질문과 같은 '마지막' human을 삭제.
  // (이전에 보낸 동일 내용 질문은 건드리지 않음 — 오삭제 방지)
  // 정리 후 세션에 메시지가 하나도 안 남으면 세션 자체도 삭제한다(빈 세션 제거).
  const cleanupEmptyExchange = async (sessionId: string, question: string) => {
    try {
      const res = await getMessages(sessionId)
      const server = res.data.data.messages
      const q = question.trim()
      const toDelete: string[] = []
      if (server.length > 0) {
        const last = server[server.length - 1]
        if (last.role === 'ai' && (last.content ?? '').trim() === '' && last.message_id) {
          toDelete.push(last.message_id)
        }
        for (let i = server.length - 1; i >= 0; i--) {
          const s = server[i]
          if (s.role === 'human' && (s.content ?? '').trim() === q && s.message_id) {
            toDelete.push(s.message_id)
            break
          }
        }
      }
      if (toDelete.length > 0) {
        await Promise.allSettled(toDelete.map((id) => deleteMessageApi(sessionId, id)))
      }
      // 정리 후 세션이 비었으면(재확인 후) 세션 자체 삭제
      if (server.length - toDelete.length <= 0) {
        const after = await getMessages(sessionId)
        if (after.data.data.messages.length === 0) {
          await deleteSession(sessionId).catch((e) => logError('deleteSession', e))
          if (get().sessionId === sessionId) set({ isDeleted: true })
        }
      }
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    } catch (e) { logError('cleanupEmptyExchange', e) }
  }

  const executeStream = async (
    sessionId: string,
    assistantId: string,
    question: string,
    isFirstMessage: boolean,
    signal: AbortSignal,
    removePairOnFail = true,
  ): Promise<void> => {
    const writer = createWriter(sessionId, assistantId)

    try {
      await streamMessage(
        sessionId,
        { question },
        writer.push,
        signal,
        writer.setSources,
      )
      writer.flushNow()
    } catch (e) {
      logError('executeStream', e)
      writer.flushNow()
      streamRegistry.delete(sessionId)
      clearInflight(sessionId)
      // 사용자가 직접 정지(signal.aborted)한 경우만 '중단'으로 보존한다.
      // idle 타임아웃 등은 진짜 오류로 취급(첫 대화면 세션 삭제). 단 첫 대화가 아니면
      // 타임아웃도 기존처럼 '중단'으로 남겨 '다시 시도'가 가능하게 둔다.
      const userAborted = signal.aborted
      const keepInterrupted = isAbortError(e) && (userAborted || !isFirstMessage)
      if (!keepInterrupted) clearCache(sessionId)
      // 첫 메시지가 진짜 실패(사용자 중단 아님)면, 현재 보고 있는 세션과 무관하게 빈 세션을 삭제한다.
      if (isFirstMessage && !keepInterrupted) {
        messageCache.delete(sessionId)
        deleteSession(sessionId)
          .then(() => queryClient.invalidateQueries({ queryKey: ['sessions'] }))
          .catch((e) => logError('deleteSession', e))
      }
      if (get().sessionId === sessionId) {
        if (keepInterrupted) {
          set((state) => ({
            isStreaming: false,
            abortController: null,
            messages: state.messages.map((m) =>
              m.id === assistantId && m.type === 'text'
                ? { ...m, status: 'interrupted' as const }
                : m
            ),
          }))
          messageCache.set(sessionId, get().messages)
        } else if (!removePairOnFail) {
          set((state) => ({
            error: '응답 중 오류가 발생했습니다.',
            isStreaming: false,
            abortController: null,
            messages: state.messages.map((m) =>
              m.id === assistantId && m.type === 'text'
                ? { ...m, status: 'interrupted' as const }
                : m
            ),
          }))
          messageCache.set(sessionId, get().messages)
        } else {
          const msgs = get().messages
          const aIdx = msgs.findIndex((m) => m.id === assistantId)
          const removeIds = new Set<string>([assistantId])
          if (aIdx > 0 && msgs[aIdx - 1].role === 'user') removeIds.add(msgs[aIdx - 1].id)
          set((state) => ({
            error: '응답 중 오류가 발생했습니다.',
            isStreaming: false,
            abortController: null,
            messages: state.messages.filter((m) => !removeIds.has(m.id)),
            ...(isFirstMessage ? { isDeleted: true } : {}),
          }))
          if (!isFirstMessage) {
            messageCache.set(sessionId, get().messages)
            // 에러로 빈 답이 된 질문도 백엔드에서 정리(빈 세션이면 세션까지 삭제).
            cleanupEmptyExchange(sessionId, question)
          }
        }
      }
      return
    }

    streamRegistry.delete(sessionId)

    const finalMsg = get().messages.find((m) => m.id === assistantId)
    const hasContent = finalMsg?.type === 'text' && finalMsg.content.trim().length > 0
    if (!hasContent) {
      clearInflight(sessionId)
      clearCache(sessionId)
      // 첫 메시지가 빈 응답이면, 현재 보고 있는 세션과 무관하게 빈 세션을 삭제한다.
      if (isFirstMessage) {
        messageCache.delete(sessionId)
        deleteSession(sessionId)
          .then(() => queryClient.invalidateQueries({ queryKey: ['sessions'] }))
          .catch((e) => logError('deleteSession', e))
      }
      if (get().sessionId === sessionId && !removePairOnFail) {
        set((state) => ({
          error: '응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.',
          isStreaming: false,
          abortController: null,
          messages: state.messages.map((m) =>
            m.id === assistantId && m.type === 'text'
              ? { ...m, status: 'interrupted' as const }
              : m
          ),
        }))
        messageCache.set(sessionId, get().messages)
      } else if (get().sessionId === sessionId) {
        const msgs = get().messages
        const aIdx = msgs.findIndex((m) => m.id === assistantId)
        const removeIds = new Set<string>([assistantId])
        if (aIdx > 0 && msgs[aIdx - 1].role === 'user') removeIds.add(msgs[aIdx - 1].id)
        set((state) => ({
          error: '응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.',
          isStreaming: false,
          abortController: null,
          messages: state.messages.filter((m) => !removeIds.has(m.id)),
          ...(isFirstMessage ? { isDeleted: true } : {}),
        }))
        if (!isFirstMessage) {
          messageCache.set(sessionId, get().messages)
          // 빈 응답: 백엔드에 남은 질문 + 빈 답변 쌍을 정리(새로고침 시 되살아나지 않도록).
          cleanupEmptyExchange(sessionId, question)
        }
      }
      return
    }

    clearInflight(sessionId)
    if (get().sessionId !== sessionId) return
    set((state) => ({
      isStreaming: false,
      abortController: null,
      messages: state.messages.map((m) =>
        m.id === assistantId ? { ...m, status: 'done' as const } : m
      ),
    }))
    messageCache.set(sessionId, get().messages)
    queryClient.invalidateQueries({ queryKey: ['sessions'] })
  }

  // 재생성: 기존 AI 메시지(assistantId)에 새 응답을 in-place로 스트리밍한다.
  // 중단/오류/빈응답 시엔 일반 생성처럼 '중단됨'으로 표시해 '다시 시도'를 노출한다.
  const executeRegenerate = async (
    sessionId: string,
    assistantId: string,
    serverId: string,
    signal: AbortSignal,
  ): Promise<void> => {
    const writer = createWriter(sessionId, assistantId)

    // 실패/중단 시: 일반 생성처럼 해당 메시지를 '중단됨'으로 남겨 '다시 시도'를 노출한다.
    // (백엔드는 재생성 시 기존 답변을 먼저 지우므로 복원하지 않음. '다시 시도'는 재조회/재전송으로 복구)
    const markInterrupted = (errorMsg?: string) => {
      streamRegistry.delete(sessionId)
      if (get().sessionId !== sessionId) return
      set((state) => ({
        ...(errorMsg ? { error: errorMsg } : {}),
        isStreaming: false,
        abortController: null,
        messages: state.messages.map((m) =>
          m.id === assistantId && m.type === 'text'
            ? { ...m, status: 'interrupted' as const }
            : m
        ),
      }))
      messageCache.set(sessionId, get().messages)
    }

    try {
      await regenerateMessageStream(sessionId, serverId, writer.push, signal, writer.setSources)
      writer.flushNow()
    } catch (e) {
      logError('executeRegenerate', e)
      writer.flushNow()
      markInterrupted(isAbortError(e) ? undefined : ((e as Error)?.message || '재생성 중 오류가 발생했습니다.'))
      return
    }

    const finalMsg = get().messages.find((m) => m.id === assistantId)
    const hasContent = finalMsg?.type === 'text' && finalMsg.content.trim().length > 0
    if (!hasContent) {
      markInterrupted('응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.')
      return
    }

    streamRegistry.delete(sessionId)

    if (get().sessionId !== sessionId) return
    set((state) => ({
      isStreaming: false,
      abortController: null,
      messages: state.messages.map((m) =>
        m.id === assistantId ? { ...m, status: 'done' as const } : m
      ),
    }))
    messageCache.set(sessionId, get().messages)
    queryClient.invalidateQueries({ queryKey: ['sessions'] })
  }

  return {
    sessionId: '',
    messages: [],
    isStreaming: false,
    error: null,
    isDeleted: false,
    abortController: null,

    clearError: () => set({ error: null }),
    resetDeleted: () => set({ isDeleted: false }),

    abortStream: () => {
      get().abortController?.abort()
      set({ abortController: null, isStreaming: false })
    },

    connect: async (sessionId: string) => {
      connectAbortController.abort();
      connectAbortController = new AbortController();
      const { signal } = connectAbortController;

      const streaming = streamRegistry.get(sessionId);
      if (streaming) {
        set({ sessionId, messages: streaming, isStreaming: true });
        return;
      }
      const prev = get();
      if (prev.sessionId === sessionId && prev.messages.length > 0) {
        set({ sessionId, isStreaming: false });
      } else {
        const cachedMessages = messageCache.get(sessionId);
        set({ sessionId, messages: cachedMessages ?? [], isStreaming: false });
      }

      let res;
      try {
        res = await getMessages(sessionId, { signal });
      } catch (e) {
        if (isAbortError(e)) return;
        logError('connect.getMessages', e);
        const cached = loadCache(sessionId);
        const pending = getInflight(sessionId);
        if (cached.length > 0) {
          set({ messages: cached });
          const lastCached = cached[cached.length - 1];
          if (lastCached?.role === 'user' && lastCached?.type === 'text' && pending) {
            clearInflight(sessionId);
            get().retryLastMessage();
          }
          return;
        }
        if (pending) {
          set((state) => ({
            messages: [
              ...state.messages,
              { id: crypto.randomUUID(), role: 'user' as const, type: 'text' as const, content: pending, createdAt: new Date().toISOString() },
            ],
          }));
          get().retryLastMessage();
          return;
        }
        throw e;
      }

      if (get().sessionId !== sessionId || get().isStreaming) return;
      const rawMessages: Message[] = res.data.data.messages.map((m) => ({
        id: m.message_id || crypto.randomUUID(),
        role: m.role === 'human' ? 'user' : 'assistant',
        type: 'text' as const,
        content: extractContent(m.content),
        status: 'done' as const,
        createdAt: m.created_at,
        ...(m.sources && m.sources.length > 0 ? { sources: m.sources } : {}),
      }));

      // 질문/답변이 같은 시각(createdAt)이면 백엔드가 순서를 뒤집어 줄 수 있어([답변, 질문]),
      // createdAt 오름차순 + 같은 시각이면 질문(user)을 먼저 오도록 안정 정렬한다(V8 sort는 stable).
      const timeOf = (s?: string) => { const n = s ? Date.parse(s) : NaN; return Number.isNaN(n) ? 0 : n; };
      const roleRank = (r: 'user' | 'assistant') => (r === 'user' ? 0 : 1);
      const ordered = [...rawMessages].sort((a, b) => {
        const ta = timeOf(a.createdAt), tb = timeOf(b.createdAt);
        if (ta !== tb) return ta - tb;
        return roleRank(a.role) - roleRank(b.role);
      });

      const deduped = ordered.filter((msg, i) => {
        if (i === 0) return true;
        const prev = ordered[i - 1];
        return !(
          msg.role === prev.role &&
          msg.type === 'text' &&
          prev.type === 'text' &&
          msg.content === prev.content &&
          msg.createdAt === prev.createdAt
        );
      });

      const dbMessages = deduped.filter(
        (msg) => !(msg.role === 'assistant' && msg.type === 'text' && msg.content.trim() === '')
      );

      const cached = messageCache.get(sessionId) ?? [];
      const base = cached.length > dbMessages.length ? cached : dbMessages;

      const pending = getInflight(sessionId);

      set({ messages: base });
      messageCache.set(sessionId, base);

      const last = base[base.length - 1];

      if (last && last.role === 'user' && last.type === 'text') {
        if (pending) get().retryLastMessage();
        return;
      }

      if (base.length === 0 && pending) {
        set((state) => ({
          messages: [
            ...state.messages,
            { id: crypto.randomUUID(), role: 'user' as const, type: 'text' as const, content: pending, createdAt: new Date().toISOString() },
          ],
        }));
        get().retryLastMessage();
        return;
      }

      // 대화가 전혀 없는 빈 세션은 열었을 때 정리한다(보낼 메시지·로컬 캐시 모두 없을 때).
      // 일시적 빈 응답으로 '실제 세션'을 지우지 않도록 삭제 직전 한 번 더 확인한다.
      if (base.length === 0 && !pending && loadCache(sessionId).length === 0) {
        let stillEmpty: boolean;
        try {
          const confirm = await getMessages(sessionId, { signal });
          stillEmpty = confirm.data.data.messages.length === 0;
        } catch (e) { logError('connect.confirmEmpty', e); stillEmpty = false; }
        if (get().sessionId !== sessionId) return;
        if (stillEmpty) {
          clearCache(sessionId);
          deleteSession(sessionId)
            .then(() => queryClient.invalidateQueries({ queryKey: ['sessions'] }))
            .catch((e) => logError('deleteSession', e));
          set({ isDeleted: true });
        }
        return;
      }

      if (pending) clearInflight(sessionId);
    },

    disconnect: () => {
      set({ sessionId: '', messages: [], isStreaming: false, abortController: null, isDeleted: false });
    },

    sendMessage: async (content: string) => {
      if (get().isStreaming) return
      const controller = new AbortController()
      const assistantId = crypto.randomUUID()
      const { sessionId, messages: existingMessages } = get()
      const isFirstMessage = existingMessages.length === 0

      saveInflight(sessionId, content)
      const now = new Date().toISOString()
      set((state) => ({
        isStreaming: true,
        abortController: controller,
        messages: [
          ...state.messages,
          { id: crypto.randomUUID(), role: 'user', type: 'text', content, createdAt: now },
          { id: assistantId, role: 'assistant', type: 'text', content: '', status: 'streaming' as const, createdAt: now },
        ],
      }))
      streamRegistry.set(sessionId, get().messages)
      saveCache(sessionId, get().messages)

      await executeStream(sessionId, assistantId, content, isFirstMessage, controller.signal)
    },

    retryLastMessage: async () => {
      if (get().isStreaming) return
      const { messages, sessionId } = get()
      const last = messages[messages.length - 1]
      if (!last || last.role !== 'user' || last.type !== 'text') return
      const isFirstMessage = messages.length === 1

      saveInflight(sessionId, last.content)
      const controller = new AbortController()
      const assistantId = crypto.randomUUID()
      const now = new Date().toISOString()
      set((state) => ({
        isStreaming: true,
        abortController: controller,
        messages: [
          ...state.messages,
          { id: assistantId, role: 'assistant', type: 'text', content: '', status: 'streaming' as const, createdAt: now },
        ],
      }))
      streamRegistry.set(sessionId, get().messages)
      saveCache(sessionId, get().messages)

      await executeStream(sessionId, assistantId, last.content, isFirstMessage, controller.signal)
    },

    sendImageMessage: (filename: string, caption?: string) => {
      set((state) => ({
        messages: [
          ...state.messages,
          { id: crypto.randomUUID(), role: 'user' as const, type: 'image' as const, filename, caption },
        ],
      }));
    },

    // AI 응답 재생성: 백엔드 재생성 SSE 엔드포인트로 in-place 스트리밍한다.
    // (재생성 버튼은 맨 아래 어시스턴트 메시지에만 노출됨)
    regenerateMessage: async (assistantId: string) => {
      if (get().isStreaming) return;
      const { messages, sessionId } = get();
      const idx = messages.findIndex((m) => m.id === assistantId);
      if (idx === -1) return;
      const target = messages[idx];
      if (target.role !== 'assistant' || target.type !== 'text') return;

      // 클릭한 답변 '바로 위'의 질문(화면에 보이는 구조 기준). 이 질문의 답변을 재생성한다.
      let prevUserId: string | null = null;
      let question: string | null = null;
      for (let i = idx - 1; i >= 0; i--) {
        const m = messages[i];
        if (m.role === 'user' && m.type === 'text') { prevUserId = m.id; question = m.content; break; }
      }
      if (question == null || prevUserId == null) {
        set({ error: '재생성할 원본 질문을 찾을 수 없습니다.' });
        return;
      }

      // 무조건 '마지막 AI'를 쓰지 않고, 그 질문(question)에 대한 답변 AI의 id를 찾는다(오매핑 방지).
      const qNorm = question.trim();
      let serverId: string | undefined;
      try {
        const res = await getMessages(sessionId);
        const server = res.data.data.messages;
        for (let i = server.length - 1; i >= 0; i--) {
          if (server[i].role === 'human' && (server[i].content ?? '').trim() === qNorm) {
            const next = server[i + 1];
            if (next && next.role !== 'human' && next.message_id) serverId = next.message_id;
            break;
          }
        }
      } catch (e) { logError('regenerate.getMessages', e) }

      if (get().sessionId !== sessionId || get().isStreaming) return;

      // 백엔드에서 그 질문의 답변을 못 찾으면 같은 질문으로 재전송한다(재전송 폴백).
      if (!serverId) {
        const removeIds = new Set<string>([prevUserId, assistantId]);
        set((state) => ({ messages: state.messages.filter((m) => !removeIds.has(m.id)) }));
        await get().sendMessage(question);
        return;
      }

      const controller = new AbortController();
      set((state) => ({
        isStreaming: true,
        abortController: controller,
        error: null,
        messages: state.messages.map((m) =>
          m.id === assistantId && m.type === 'text'
            ? { ...m, content: '', sources: undefined, status: 'streaming' as const }
            : m
        ),
      }));
      streamRegistry.set(sessionId, get().messages);

      await executeRegenerate(sessionId, assistantId, serverId, controller.signal);
    },
  }
});
