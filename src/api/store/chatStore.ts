import { create } from 'zustand';
import axios from 'axios';
import type { Message, Source } from '../../types';
import { streamMessage, getMessages, deleteMessage as deleteMessageApi, regenerateMessageStream } from '../services/chat';
import { deleteSession } from '../services/session';
import { queryClient } from '../queryClient';

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
  } catch { /* 저장 실패 무시(용량 초과 등) */ }
}

const loadCache = (sessionId: string): Message[] => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY(sessionId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const clearCache = (sessionId: string) => {
  messageCache.delete(sessionId)
  try { sessionStorage.removeItem(CACHE_KEY(sessionId)) } catch { /* 무시 */ }
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
  } catch { /* 무시 */ }
}

const getInflight = (sessionId: string): string | null => {
  try {
    const raw = localStorage.getItem(INFLIGHT_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    return data.sessionId === sessionId ? data.question : null
  } catch {
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

  // 스트리밍/재생성 완료 후 백엔드 message_id를 로컬 메시지의 serverId로 동기화한다.
  // (방금 생성된 메시지는 로컬 UUID만 가지므로, 삭제/재생성 API 호출에 필요한 실제 id를 채워준다)
  // 최신 메시지가 꼬리에 모이므로 뒤에서부터 같은 role끼리 짝지어 채운다.
  const syncServerIds = async (sessionId: string) => {
    try {
      const res = await getMessages(sessionId)
      const server = res.data.data.messages
      set((state) => {
        if (state.sessionId !== sessionId) return {}
        const textIdxs: number[] = []
        state.messages.forEach((m, i) => { if (m.type === 'text') textIdxs.push(i) })
        const messages = state.messages.slice()
        const pairs = Math.min(textIdxs.length, server.length)
        for (let k = 1; k <= pairs; k++) {
          const mi = textIdxs[textIdxs.length - k]
          const s = server[server.length - k]
          const m = messages[mi]
          const sRole = s.role === 'human' ? 'user' : 'assistant'
          if (m.type === 'text' && s.message_id && sRole === m.role) {
            messages[mi] = { ...m, serverId: s.message_id }
          }
        }
        return { messages }
      })
    } catch { /* 동기화 실패는 무시(다음 전송/재생성 때 다시 시도) */ }
  }

  // 빈 응답을 받았을 때 백엔드에 남은 잔여물(이번 교환에서 새로 생긴 질문 + 빈 AI 답변)을 정리한다.
  // 안전장치: '로컬에 이미 알고 있던(serverId 보유) 메시지'는 절대 건드리지 않고,
  // 이번에 새로 생긴 것 중에서도 (질문과 동일한 human) 또는 (내용이 빈 ai)만 삭제한다.
  const cleanupEmptyExchange = async (sessionId: string, question: string) => {
    try {
      const knownIds = new Set<string>()
      get().messages.forEach((m) => { if (m.type === 'text' && m.serverId) knownIds.add(m.serverId) })

      const res = await getMessages(sessionId)
      const server = res.data.data.messages
      const toDelete = server
        .filter((s) => s.message_id && !knownIds.has(s.message_id))
        .filter((s) =>
          (s.role === 'human' && s.content === question) ||
          (s.role === 'ai' && (s.content ?? '').trim() === '')
        )
        .map((s) => s.message_id)

      if (toDelete.length === 0) return
      await Promise.allSettled(toDelete.map((id) => deleteMessageApi(sessionId, id)))
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    } catch { /* 정리 실패는 무시 */ }
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
      writer.flushNow()
      streamRegistry.delete(sessionId)
      clearInflight(sessionId)
      // 사용자가 직접 정지(signal.aborted)한 경우만 '중단'으로 보존한다.
      // idle 타임아웃 등은 진짜 오류로 취급(첫 대화면 세션 삭제). 단 첫 대화가 아니면
      // 타임아웃도 기존처럼 '중단'으로 남겨 '다시 시도'가 가능하게 둔다.
      const userAborted = signal.aborted
      const keepInterrupted = isAbortError(e) && (userAborted || !isFirstMessage)
      if (!keepInterrupted) clearCache(sessionId)
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
          if (isFirstMessage) {
            messageCache.delete(sessionId)
            deleteSession(sessionId)
              .then(() => queryClient.invalidateQueries({ queryKey: ['sessions'] }))
              .catch(() => {})
          } else {
            messageCache.set(sessionId, get().messages)
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
        if (isFirstMessage) {
          messageCache.delete(sessionId)
          deleteSession(sessionId)
            .then(() => queryClient.invalidateQueries({ queryKey: ['sessions'] }))
            .catch(() => {})
        } else {
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
    // 방금 생성된 메시지에 백엔드 message_id를 채워 삭제/재생성이 동작하도록 한다.
    syncServerIds(sessionId)
  }

  // 재생성: 기존 AI 메시지(assistantId)에 새 응답을 in-place로 스트리밍한다.
  // 실패/중단 시 이전 내용(prevContent/prevSources)을 복원한다.
  const executeRegenerate = async (
    sessionId: string,
    assistantId: string,
    serverId: string,
    signal: AbortSignal,
    prevContent: string,
    prevSources?: Source[],
  ): Promise<void> => {
    const writer = createWriter(sessionId, assistantId)

    try {
      await regenerateMessageStream(sessionId, serverId, writer.push, signal, writer.setSources)
      writer.flushNow()
    } catch (e) {
      writer.flushNow()
      streamRegistry.delete(sessionId)
      if (get().sessionId === sessionId) {
        // 중단/오류 모두 이전 응답으로 복원(빈 말풍선 방지)
        set((state) => ({
          ...(isAbortError(e) ? {} : { error: (e as Error)?.message || '재생성 중 오류가 발생했습니다.' }),
          isStreaming: false,
          abortController: null,
          messages: state.messages.map((m) =>
            m.id === assistantId && m.type === 'text'
              ? { ...m, content: prevContent, sources: prevSources, status: 'done' as const }
              : m
          ),
        }))
        messageCache.set(sessionId, get().messages)
      }
      return
    }

    streamRegistry.delete(sessionId)

    const finalMsg = get().messages.find((m) => m.id === assistantId)
    const hasContent = finalMsg?.type === 'text' && finalMsg.content.trim().length > 0
    if (!hasContent) {
      if (get().sessionId === sessionId) {
        set((state) => ({
          error: '응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.',
          isStreaming: false,
          abortController: null,
          messages: state.messages.map((m) =>
            m.id === assistantId && m.type === 'text'
              ? { ...m, content: prevContent, sources: prevSources, status: 'done' as const }
              : m
          ),
        }))
        messageCache.set(sessionId, get().messages)
      }
      return
    }

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
    // 재생성으로 새 AI 메시지가 저장되었으므로 message_id를 다시 동기화한다.
    syncServerIds(sessionId)
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
        serverId: m.message_id,
        role: m.role === 'human' ? 'user' : 'assistant',
        type: 'text' as const,
        content: extractContent(m.content),
        status: 'done' as const,
        createdAt: m.created_at,
        ...(m.sources && m.sources.length > 0 ? { sources: m.sources } : {}),
      }));

      // 백엔드가 이미 시간순으로 주므로 재정렬하지 않는다(재정렬 시 Q/A가 뒤바뀔 수 있음).
      const deduped = rawMessages.filter((msg, i) => {
        if (i === 0) return true;
        const prev = rawMessages[i - 1];
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
      const target = messages.find((m) => m.id === assistantId);
      if (!target || target.role !== 'assistant' || target.type !== 'text') return;

      // 백엔드 message_id 확보(없으면 1회 조회해 마지막 AI 메시지 id를 사용)
      let serverId = target.serverId;
      if (!serverId) {
        try {
          const res = await getMessages(sessionId);
          const aiList = res.data.data.messages.filter((m) => m.role === 'ai');
          serverId = aiList[aiList.length - 1]?.message_id;
        } catch { /* 조회 실패 시 아래 재전송 폴백으로 진행 */ }
      }
      // serverId를 못 구하면(중단된 임시 메시지 등) 직전 질문으로 재전송한다.
      // (원본 Q&A 제거 후 맨 아래에서 새로 생성 — 어차피 마지막 메시지이므로 위치 동일)
      if (!serverId) {
        const idx = messages.findIndex((m) => m.id === assistantId);
        const prevUser = messages.slice(0, idx).reverse().find((m) => m.role === 'user' && m.type === 'text');
        if (prevUser && prevUser.type === 'text') {
          const q = prevUser.content;
          const removeIds = new Set<string>([prevUser.id, assistantId]);
          set((state) => ({ messages: state.messages.filter((m) => !removeIds.has(m.id)) }));
          await get().sendMessage(q);
        } else {
          set({ error: '재생성할 수 없습니다. 잠시 후 다시 시도해주세요.' });
        }
        return;
      }

      const prevContent = target.content;
      const prevSources = target.sources;

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

      await executeRegenerate(sessionId, assistantId, serverId, controller.signal, prevContent, prevSources);
    },
  }
});
