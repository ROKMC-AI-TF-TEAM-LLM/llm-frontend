import { create } from 'zustand';
import type { Message } from '../../types';

interface ChatStore {
  messages: Message[];
  connect: (sessionId: string) => void;
  disconnect: () => void;
  sendMessage: (content: string) => void;
  sendImageMessage: (filename: string, caption?: string) => void;
  regenerateMessage: (assistantId: string) => void;
}

const MOCK_REPLY = '안녕하세요! 무엇을 도와드릴까요?';

// Tracks active streaming intervals per message so they can be cancelled before restarting.
const activeIntervals = new Map<string, ReturnType<typeof setInterval>>();

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  connect: (_sessionId: string) => {},
  disconnect: () => {},
  sendImageMessage: (filename: string, caption?: string) => {
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role: 'user' as const,
          type: 'image' as const,
          filename,
          caption,
          status: 'done' as const,
        },
      ],
    }));
  },
  regenerateMessage: (assistantId: string) => {
    const existing = activeIntervals.get(assistantId);
    if (existing) clearInterval(existing);

    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === assistantId ? { ...m, content: '', status: 'streaming' as const } : m
      ),
    }));

    let i = 0;
    const interval = setInterval(() => {
      i++;
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === assistantId ? { ...m, content: MOCK_REPLY.slice(0, i) } : m
        ),
      }));
      if (i >= MOCK_REPLY.length) {
        clearInterval(interval);
        activeIntervals.delete(assistantId);
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantId ? { ...m, status: 'done' as const } : m
          ),
        }));
      }
    }, 40);

    activeIntervals.set(assistantId, interval);
  },
  sendMessage: (content: string) => {
    const assistantId = crypto.randomUUID();

    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role: 'user',
          type: 'text',
          content,
          status: 'done',
        },
        {
          id: assistantId,
          role: 'assistant',
          type: 'text',
          content: '',
          status: 'streaming',
        },
      ],
    }));

    // simulate streaming character by character
    let i = 0;
    const interval = setInterval(() => {
      i++;
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === assistantId
            ? { ...m, content: MOCK_REPLY.slice(0, i) }
            : m
        ),
      }));
      if (i >= MOCK_REPLY.length) {
        clearInterval(interval);
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantId ? { ...m, status: 'done' } : m
          ),
        }));
      }
    }, 40);
  },
}));