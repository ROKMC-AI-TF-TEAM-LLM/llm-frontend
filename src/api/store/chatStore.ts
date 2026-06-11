import { create } from 'zustand';
import axios from 'axios';
import type { Message } from '../../types';
import { streamMessage, getMessages } from '../services/chat';
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

// 세션별 메시지 메모리 캐시 — 다른 세션을 갔다 와도 즉시 표시(빈 화면 방지)되도록 보관
const messageCache = new Map<string, Message[]>();

// 해당 세션의 캐시된(또는 현재 표시중인) 메시지를 동기적으로 조회
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
  } catch {}
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
  try { sessionStorage.removeItem(CACHE_KEY(sessionId)) } catch {}
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
  } catch {}
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

  const executeStream = async (
    sessionId: string,
    assistantId: string,
    question: string,
    isFirstMessage: boolean,
    signal: AbortSignal,
  ): Promise<void> => {
    try {
      await streamMessage(
        sessionId,
        { question },
        (chunk) => {
          if (get().sessionId !== sessionId) {
            const reg = streamRegistry.get(sessionId)
            if (reg) {
              streamRegistry.set(sessionId, reg.map((m) =>
                m.id === assistantId && m.type === 'text'
                  ? { ...m, content: m.content + chunk }
                  : m
              ))
            }
            return
          }
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === assistantId && m.type === 'text'
                ? { ...m, content: m.content + chunk }
                : m
            ),
          }))
          streamRegistry.set(sessionId, get().messages)
        },
        signal,
        (sources) => {
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === assistantId && m.type === 'text' ? { ...m, sources } : m
            ),
          }))
        },
      )
    } catch (e) {
      streamRegistry.delete(sessionId)
      clearInflight(sessionId)
      if (!isAbortError(e)) clearCache(sessionId)
      if (get().sessionId === sessionId) {
        if (isAbortError(e)) {
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
        } else {
          // 실패한 질문+응답을 한 쌍으로 함께 제거 (에러난 메시지가 화면에 남지 않도록)
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

    // 스트림이 에러 없이 끝났지만 텍스트를 한 글자도 못 받은 경우 = 실패로 간주
    const finalMsg = get().messages.find((m) => m.id === assistantId)
    const hasContent = finalMsg?.type === 'text' && finalMsg.content.trim().length > 0
    if (!hasContent) {
      clearInflight(sessionId)
      clearCache(sessionId)
      if (get().sessionId === sessionId) {
        // 실패한 질문+빈응답 쌍을 함께 제거 (화면에 남지 않도록)
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
      // 빈 화면 방지: 같은 세션은 기존 메시지 유지, 다른 세션은 캐시가 있으면 즉시 표시 후 백그라운드 갱신
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
        // API 실패 시 캐시/인플라이트로 복구 시도
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
        id: crypto.randomUUID(),
        role: m.role === 'human' ? 'user' : 'assistant',
        type: 'text' as const,
        content: extractContent(m.content),
        status: 'done' as const,
        createdAt: m.created_at,
        ...(m.sources && m.sources.length > 0 ? { sources: m.sources } : {}),
      }));

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

      // 백엔드가 저장한 실패 응답(텍스트 없는 assistant)은 직전 질문과 한 쌍으로 묶어 화면에서 숨김
      const removeIdx = new Set<number>();
      deduped.forEach((msg, i) => {
        if (msg.role === 'assistant' && msg.type === 'text' && msg.content.trim() === '') {
          removeIdx.add(i);
          for (let j = i - 1; j >= 0; j--) {
            if (removeIdx.has(j)) continue;
            if (deduped[j].role === 'user') removeIdx.add(j);
            break;
          }
        }
      });
      const dbMessages = deduped.filter((_, i) => !removeIdx.has(i));

      // 세션 전환 시 현재 탭 캐시(중단 등 로컬 상태 포함)가 DB보다 풍부하면 캐시를 유지
      const cached = messageCache.get(sessionId) ?? [];
      const base = cached.length > dbMessages.length ? cached : dbMessages;

      const pending = getInflight(sessionId);

      // 답변(assistant)이 뒤따르지 않는 user 질문 = 답변 못 받은 오류 메시지 → 제거.
      // 중단한 메시지는 interrupted assistant가 뒤따르므로 유지됨. 마지막 질문이 진행중(inflight)이면 유지하고 재전송.
      const messages = base.filter((msg, i) => {
        if (msg.role !== 'user' || msg.type !== 'text') return true;
        const next = base[i + 1];
        if (next && next.role === 'assistant') return true;
        if (i === base.length - 1 && pending) return true;
        return false;
      });

      set({ messages });
      messageCache.set(sessionId, messages);

      const last = messages[messages.length - 1];

      // (1) 마지막이 user 메시지 = 진행중 질문이므로 재전송.
      if (last && last.role === 'user' && last.type === 'text') {
        if (pending) get().retryLastMessage();
        return;
      }

      // (2) 비어있는 새 세션인데 보낼 질문이 남아있음 = 첫 질문 전송 (새로고침 시 재전송).
      if (messages.length === 0 && pending) {
        set((state) => ({
          messages: [
            ...state.messages,
            { id: crypto.randomUUID(), role: 'user' as const, type: 'text' as const, content: pending, createdAt: new Date().toISOString() },
          ],
        }));
        get().retryLastMessage();
        return;
      }

      // (3) 대화 내용이 전혀 없고 보낼 질문도 없는 빈 세션 = 정리(삭제).
      if (messages.length === 0) {
        messageCache.delete(sessionId);
        set({ isDeleted: true, error: '대화 내용이 없어 세션을 정리했습니다.' });
        deleteSession(sessionId)
          .then(() => queryClient.invalidateQueries({ queryKey: ['sessions'] }))
          .catch(() => {});
        return;
      }

      // (4) 남은 inflight 정리.
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
      // 메시지가 user 1개뿐이면 새 세션의 첫 질문 → 실패 시 빈 세션 정리 필요
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

    regenerateMessage: async (assistantId: string) => {
      if (get().isStreaming) return;
      const { messages, sessionId } = get();
      const assistantIdx = messages.findIndex((m) => m.id === assistantId);
      if (assistantIdx === -1) return;

      const prevUserMsg = messages
        .slice(0, assistantIdx)
        .reverse()
        .find((m) => m.role === 'user' && m.type === 'text');

      if (!prevUserMsg || prevUserMsg.type !== 'text') return;
      const question = prevUserMsg.content;
      const userId = prevUserMsg.id;

      const controller = new AbortController();
      const newAssistantId = crypto.randomUUID();
      const now = new Date().toISOString();
      saveInflight(sessionId, question);

      // 재생성 = 원래 질문+답변을 제거하고 맨 아래로 이동시켜 새로 생성 (질문 복제 방지)
      set((state) => ({
        isStreaming: true,
        abortController: controller,
        messages: [
          ...state.messages.filter((m) => m.id !== assistantId && m.id !== userId),
          { id: crypto.randomUUID(), role: 'user' as const, type: 'text' as const, content: question, createdAt: now },
          { id: newAssistantId, role: 'assistant' as const, type: 'text' as const, content: '', status: 'streaming' as const, createdAt: now },
        ],
      }));
      streamRegistry.set(sessionId, get().messages);
      saveCache(sessionId, get().messages);
      await executeStream(sessionId, newAssistantId, question, false, controller.signal);
    },
  }
});
