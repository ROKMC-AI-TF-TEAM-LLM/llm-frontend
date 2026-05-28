import { create } from 'zustand';
import type { Message } from '../../types';
import { streamMessage, getMessages } from '../services/chat';
import { queryClient } from '../queryClient';

interface ChatStore {
  sessionId: string;
  messages: Message[];
  isStreaming: boolean;
  error: string | null;
  abortController: AbortController | null;
  clearError: () => void;
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

const extractContent = (raw: string): string => {
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed.content === 'string') return parsed.content
    if (typeof parsed.answer === 'string') return parsed.answer
    if (typeof parsed.text === 'string') return parsed.text
    return raw
  } catch {
    return raw
  }
}

const streamRegistry = new Map<string, Message[]>();

export const useChatStore = create<ChatStore>((set, get) => ({
  sessionId: '',
  messages: [],
  isStreaming: false,
  error: null,
  abortController: null,

  clearError: () => set({ error: null }),

  abortStream: () => {
    get().abortController?.abort()
    set({ abortController: null })
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
    const messages: Message[] = res.data.data.messages.map((m) => ({
      id: crypto.randomUUID(),
      role: m.role === 'human' ? 'user' : 'assistant',
      type: 'text' as const,
      content: extractContent(m.content),
      status: 'done' as const,
    }));
    set({ messages });

    const last = messages[messages.length - 1];
    if (last && last.role === 'user' && last.type === 'text') {
      get().retryLastMessage();
    }
  },

  disconnect: () => {
    set({ sessionId: '', messages: [], isStreaming: false, abortController: null });
  },

  sendMessage: async (content: string) => {
    if (get().isStreaming) return;
    const controller = new AbortController()
    const assistantId = crypto.randomUUID();
    const { sessionId } = get();

    set((state) => ({
      isStreaming: true,
      abortController: controller,
      messages: [
        ...state.messages,
        { id: crypto.randomUUID(), role: 'user', type: 'text', content },
        { id: assistantId, role: 'assistant', type: 'text', content: '', status: 'streaming' },
      ],
    }));
    streamRegistry.set(sessionId, get().messages);

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
      }, controller.signal);
    } catch (e) {
      streamRegistry.delete(sessionId);
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
          set((state) => ({
            error: '응답 중 오류가 발생했습니다.',
            isStreaming: false,
            abortController: null,
            messages: state.messages.filter((m) => m.id !== assistantId),
          }));
        }
      }
      return;
    }

    streamRegistry.delete(sessionId);
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
      }, controller.signal);
    } catch (e) {
      streamRegistry.delete(sessionId);
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
          set((state) => ({
            error: '응답 중 오류가 발생했습니다.',
            isStreaming: false,
            abortController: null,
            messages: state.messages.filter((m) => m.id !== assistantId),
          }));
        }
      }
      return;
    }

    streamRegistry.delete(sessionId);
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

    const oldMsg = messages[assistantIdx];
    const oldContent = oldMsg.type === 'text' ? oldMsg.content : '';

    const controller = new AbortController()
    set((state) => ({
      isStreaming: true,
      abortController: controller,
      messages: state.messages.map((m) =>
        m.id === assistantId ? { ...m, content: '', status: 'streaming' as const } : m
      ),
    }));

    try {
      await streamMessage(sessionId, { question: prevUserMsg.content }, (chunk) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantId && m.type === 'text'
              ? { ...m, content: m.content + chunk }
              : m
          ),
        }));
      }, controller.signal);
    } catch (e) {
      set((state) => ({
        isStreaming: false,
        abortController: null,
        messages: state.messages.map((m) =>
          m.id === assistantId && m.type === 'text'
            ? {
                ...m,
                content: isAbortError(e) ? m.content : oldContent,
                status: isAbortError(e) ? 'interrupted' as const : 'done' as const,
              }
            : m
        ),
        ...(isAbortError(e) ? {} : { error: '응답 중 오류가 발생했습니다.' }),
      }));
      return;
    }

    set((state) => ({
      isStreaming: false,
      abortController: null,
      messages: state.messages.map((m) =>
        m.id === assistantId ? { ...m, status: 'done' as const } : m
      ),
    }));
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
  },
}));
