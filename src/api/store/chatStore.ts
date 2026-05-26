import { create } from 'zustand';
import type { Message } from '../../types';
import { streamMessage, getMessages } from '../services/chat';

interface ChatStore {
  sessionId: string;
  messages: Message[];
  isStreaming: boolean;
  error: string | null;
  clearError: () => void;
  connect: (sessionId: string) => Promise<void>;
  disconnect: () => void;
  sendMessage: (content: string) => Promise<void>;
  retryLastMessage: () => Promise<void>;
  sendImageMessage: (filename: string, caption?: string) => void;
  regenerateMessage: (assistantId: string) => Promise<void>;
}

const streamRegistry = new Map<string, Message[]>();

export const useChatStore = create<ChatStore>((set, get) => ({
  sessionId: '',
  messages: [],
  isStreaming: false,
  error: null,
  clearError: () => set({ error: null }),

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
      content: m.content,
      status: 'done' as const,
    }));
    set({ messages });

    const last = messages[messages.length - 1];
    if (last && last.role === 'user' && last.type === 'text') {
      get().retryLastMessage();
    }
  },

  disconnect: () => {
    set({ sessionId: '', messages: [], isStreaming: false });
  },

  sendMessage: async (content: string) => {
    if (get().isStreaming) return;
    const assistantId = crypto.randomUUID();
    const { sessionId } = get();

    set((state) => ({
      isStreaming: true,
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
      });
    } catch {
      streamRegistry.delete(sessionId);
      if (get().sessionId === sessionId) {
        set((state) => ({
          error: '응답 중 오류가 발생했습니다.',
          isStreaming: false,
          messages: state.messages.filter((m) => m.id !== assistantId),
        }));
      }
      return;
    }

    streamRegistry.delete(sessionId);
    if (get().sessionId !== sessionId) return;
    set((state) => ({
      isStreaming: false,
      messages: state.messages.map((m) =>
        m.id === assistantId ? { ...m, status: 'done' as const } : m
      ),
    }));
  },

  retryLastMessage: async () => {
    if (get().isStreaming) return;
    const { messages, sessionId } = get();
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'user' || last.type !== 'text') return;

    const assistantId = crypto.randomUUID();
    set((state) => ({
      isStreaming: true,
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
      });
    } catch {
      streamRegistry.delete(sessionId);
      if (get().sessionId === sessionId) {
        set((state) => ({
          error: '응답 중 오류가 발생했습니다.',
          isStreaming: false,
          messages: state.messages.filter((m) => m.id !== assistantId),
        }));
      }
      return;
    }

    streamRegistry.delete(sessionId);
    if (get().sessionId !== sessionId) return;
    set((state) => ({
      isStreaming: false,
      messages: state.messages.map((m) =>
        m.id === assistantId ? { ...m, status: 'done' as const } : m
      ),
    }));
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

    set((state) => ({
      isStreaming: true,
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
      });
    } catch {
      set((state) => ({
        error: '응답 중 오류가 발생했습니다.',
        isStreaming: false,
        messages: state.messages.map((m) =>
          m.id === assistantId && m.type === 'text' ? { ...m, content: oldContent, status: 'done' as const } : m
        ),
      }));
      return;
    }
    set((state) => ({
      isStreaming: false,
      messages: state.messages.map((m) =>
        m.id === assistantId ? { ...m, status: 'done' as const } : m
      ),
    }));
  },
}));
