import { create } from 'zustand';
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
  e instanceof DOMException && e.name === 'AbortError'

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

export const useChatStore = create<ChatStore>((set, get) => ({
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
    const streaming = streamRegistry.get(sessionId);
    if (streaming) {
      set({ sessionId, messages: streaming, isStreaming: true });
      return;
    }
    set({ sessionId, messages: [], isStreaming: false });
    const res = await getMessages(sessionId);
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

    const messages = rawMessages.filter((msg, i) => {
      if (i === 0) return true;
      const prev = rawMessages[i - 1];
      return !(
        msg.role === prev.role &&
        msg.type === 'text' &&
        prev.type === 'text' &&
        msg.content === prev.content
      );
    });

    set({ messages });

    const last = messages[messages.length - 1];
    if (last && last.role === 'user' && last.type === 'text') {
      if (getInflight(sessionId)) {
        get().retryLastMessage();
      }
      return;
    }

    const cached = loadCache(sessionId);
    if (cached.length > messages.length) {
      clearCache(sessionId);
      set({ messages: cached });
      const lastCached = cached[cached.length - 1];
      if (lastCached?.role === 'user' && lastCached?.type === 'text' && getInflight(sessionId)) {
        clearInflight(sessionId);
        get().retryLastMessage();
      }
      return;
    }

    const pending = getInflight(sessionId);
    if (pending) {
      const lastUserMsg = [...messages].reverse()
        .find((m) => m.role === 'user' && m.type === 'text');
      const alreadySaved = lastUserMsg?.type === 'text' && lastUserMsg.content === pending;
      if (!alreadySaved) {
        set((state) => ({
          messages: [
            ...state.messages,
            { id: crypto.randomUUID(), role: 'user' as const, type: 'text' as const, content: pending },
          ],
        }));
        get().retryLastMessage();
      } else {
        clearInflight(sessionId);
      }
    }
  },

  disconnect: () => {
    set({ sessionId: '', messages: [], isStreaming: false, abortController: null, isDeleted: false });
  },

  sendMessage: async (content: string) => {
    if (get().isStreaming) return;
    const controller = new AbortController()
    const assistantId = crypto.randomUUID();
    const { sessionId, messages: existingMessages } = get();
    const isFirstMessage = existingMessages.length === 0;

    saveInflight(sessionId, content);
    const now = new Date().toISOString();
    set((state) => ({
      isStreaming: true,
      abortController: controller,
      messages: [
        ...state.messages,
        { id: crypto.randomUUID(), role: 'user', type: 'text', content, createdAt: now },
        { id: assistantId, role: 'assistant', type: 'text', content: '', status: 'streaming' as const, createdAt: now },
      ],
    }));
    streamRegistry.set(sessionId, get().messages);
    saveCache(sessionId, get().messages);

    try {
      await streamMessage(sessionId, { question: content }, (chunk) => {
        if (get().sessionId !== sessionId) {
          const reg = streamRegistry.get(sessionId);
          if (reg) {
            streamRegistry.set(sessionId, reg.map((m) =>
              m.id === assistantId && m.type === 'text'
                ? { ...m, content: m.content + chunk }
                : m
            ));
          }
          return;
        }
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantId && m.type === 'text'
              ? { ...m, content: m.content + chunk }
              : m
          ),
        }));
        streamRegistry.set(sessionId, get().messages);
      }, controller.signal, (sources) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantId && m.type === 'text' ? { ...m, sources } : m
          ),
        }));
      });
    } catch (e) {
      streamRegistry.delete(sessionId);
      clearInflight(sessionId);
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
          }));
        } else {
          clearCache(sessionId);
          if (get().sessionId === sessionId) {
            set((state) => ({
              error: '응답 중 오류가 발생했습니다.',
              isStreaming: false,
              abortController: null,
              messages: state.messages.filter((m) => m.id !== assistantId),
              ...(isFirstMessage ? { isDeleted: true } : {}),
            }));
            if (isFirstMessage) {
              deleteSession(sessionId)
                .then(() => queryClient.invalidateQueries({ queryKey: ['sessions'] }))
                .catch(() => {});
            }
          }
        }
      }
      return;
    }

    streamRegistry.delete(sessionId);
    clearInflight(sessionId);
    if (get().sessionId !== sessionId) return;
    set((state) => ({
      isStreaming: false,
      abortController: null,
      messages: state.messages.map((m) =>
        m.id === assistantId ? { ...m, status: 'done' as const } : m
      ),
    }));
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
  },

  retryLastMessage: async () => {
    if (get().isStreaming) return;
    const { messages, sessionId } = get();
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'user' || last.type !== 'text') return;
    const isFirstMessage = messages.length === 1;

    saveInflight(sessionId, last.content);
    const controller = new AbortController()
    const assistantId = crypto.randomUUID();
    set((state) => ({
      isStreaming: true,
      abortController: controller,
      messages: [
        ...state.messages,
        { id: assistantId, role: 'assistant', type: 'text', content: '', status: 'streaming' },
      ],
    }));
    streamRegistry.set(sessionId, get().messages);
    saveCache(sessionId, get().messages);

    try {
      await streamMessage(sessionId, { question: last.content }, (chunk) => {
        if (get().sessionId !== sessionId) {
          const reg = streamRegistry.get(sessionId);
          if (reg) {
            streamRegistry.set(sessionId, reg.map((m) =>
              m.id === assistantId && m.type === 'text'
                ? { ...m, content: m.content + chunk }
                : m
            ));
          }
          return;
        }
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantId && m.type === 'text'
              ? { ...m, content: m.content + chunk }
              : m
          ),
        }));
        streamRegistry.set(sessionId, get().messages);
      }, controller.signal, (sources) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantId && m.type === 'text' ? { ...m, sources } : m
          ),
        }));
      });
    } catch (e) {
      streamRegistry.delete(sessionId);
      clearInflight(sessionId);
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
          }));
        } else {
          clearCache(sessionId);
          if (get().sessionId === sessionId) {
            set((state) => ({
              error: '응답 중 오류가 발생했습니다.',
              isStreaming: false,
              abortController: null,
              messages: state.messages.filter((m) => m.id !== assistantId),
              ...(isFirstMessage ? { isDeleted: true } : {}),
            }));
            if (isFirstMessage) {
              deleteSession(sessionId)
                .then(() => queryClient.invalidateQueries({ queryKey: ['sessions'] }))
                .catch(() => {});
            }
          }
        }
      }
      return;
    }

    streamRegistry.delete(sessionId);
    clearInflight(sessionId);
    if (get().sessionId !== sessionId) return;
    set((state) => ({
      isStreaming: false,
      abortController: null,
      messages: state.messages.map((m) =>
        m.id === assistantId ? { ...m, status: 'done' as const } : m
      ),
    }));
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
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
    const userIdx = messages.findIndex((m) => m.id === prevUserMsg.id);
    const isLast = assistantIdx === messages.length - 1;
    const isFirstMessage = userIdx === 0;

    const controller = new AbortController()
    const newAssistantId = crypto.randomUUID();

    saveInflight(sessionId, prevUserMsg.content);

    if (isLast) {
      set((state) => ({
        isStreaming: true,
        abortController: controller,
        messages: [
          ...state.messages.slice(0, userIdx),
          { id: crypto.randomUUID(), role: 'user' as const, type: 'text' as const, content: prevUserMsg.content },
          { id: newAssistantId, role: 'assistant' as const, type: 'text' as const, content: '', status: 'streaming' as const },
        ],
      }));
    } else {
      set((state) => ({
        isStreaming: true,
        abortController: controller,
        messages: state.messages.map((m) =>
          m.id === assistantId && m.type === 'text'
            ? { ...m, id: newAssistantId, content: '', status: 'streaming' as const }
            : m
        ),
      }));
    }

    streamRegistry.set(sessionId, get().messages);

    try {
      await streamMessage(sessionId, { question: prevUserMsg.content }, (chunk) => {
        if (get().sessionId !== sessionId) {
          const reg = streamRegistry.get(sessionId);
          if (reg) {
            streamRegistry.set(sessionId, reg.map((m) =>
              m.id === newAssistantId && m.type === 'text'
                ? { ...m, content: m.content + chunk }
                : m
            ));
          }
          return;
        }
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === newAssistantId && m.type === 'text'
              ? { ...m, content: m.content + chunk }
              : m
          ),
        }));
        streamRegistry.set(sessionId, get().messages);
      }, controller.signal, (sources) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === newAssistantId && m.type === 'text' ? { ...m, sources } : m
          ),
        }));
      });
    } catch (e) {
      streamRegistry.delete(sessionId);
      clearInflight(sessionId);
      clearCache(sessionId);
      if (get().sessionId === sessionId) {
        const shouldDelete = !isAbortError(e) && isFirstMessage;
        set((state) => ({
          isStreaming: false,
          abortController: null,
          messages: isAbortError(e)
            ? state.messages.map((m) =>
                m.id === newAssistantId && m.type === 'text'
                  ? { ...m, status: 'interrupted' as const }
                  : m
              )
            : state.messages.filter((m) => m.id !== newAssistantId),
          ...(isAbortError(e) ? {} : { error: '응답 중 오류가 발생했습니다.' }),
          ...(shouldDelete ? { isDeleted: true } : {}),
        }));
        if (shouldDelete) {
          deleteSession(sessionId)
            .then(() => queryClient.invalidateQueries({ queryKey: ['sessions'] }))
            .catch(() => {});
        }
      }
      return;
    }

    streamRegistry.delete(sessionId);
    clearInflight(sessionId);
    if (get().sessionId !== sessionId) return;
    set((state) => ({
      isStreaming: false,
      abortController: null,
      messages: state.messages.map((m) =>
        m.id === newAssistantId ? { ...m, status: 'done' as const } : m
      ),
    }));
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
  },

}));
