import { create } from 'zustand';
import type { Message } from '../../types';
import { streamMessage, getMessages } from '../services/chat';

interface ChatStore {
  sessionId: string;
  messages: Message[];
  isStreaming: boolean;
  connect: (sessionId: string) => Promise<void>;
  disconnect: () => void;
  sendMessage: (content: string) => Promise<void>;
  sendImageMessage: (filename: string, caption?: string) => void;
  regenerateMessage: (assistantId: string) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  sessionId: '',
  messages: [],
  isStreaming: false,

  connect: async (sessionId: string) => {
    set({ sessionId, messages: [], isStreaming: false });
    const res = await getMessages(sessionId);
    const messages: Message[] = res.data.data.messages.map((m) => ({
      id: crypto.randomUUID(),
      role: m.role === 'human' ? 'user' : 'assistant',
      type: 'text' as const,
      content: m.content,
      status: 'done' as const,
    }));
    set({ messages });
  },

  disconnect: () => {
    set({ sessionId: '', messages: [], isStreaming: false });
  },

  sendMessage: async (content: string) => {
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

    try {
      await streamMessage(sessionId, { question: content }, (chunk) => {
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
        messages: state.messages.map((m) =>
          m.id === assistantId && m.type === 'text'
            ? { ...m, content: m.content || '응답 중 오류가 발생했습니다.' }
            : m
        ),
      }));
    } finally {
      set((state) => ({
        isStreaming: false,
        messages: state.messages.map((m) =>
          m.id === assistantId ? { ...m, status: 'done' as const } : m
        ),
      }));
    }
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
        messages: state.messages.map((m) =>
          m.id === assistantId && m.type === 'text'
            ? { ...m, content: oldContent }
            : m
        ),
      }));
    } finally {
      set((state) => ({
        isStreaming: false,
        messages: state.messages.map((m) =>
          m.id === assistantId ? { ...m, status: 'done' as const } : m
        ),
      }));
    }
  },
}));
