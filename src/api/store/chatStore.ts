import { create } from 'zustand';
import axios from 'axios';
import type { Message, Source, FileAttachment, Notice, StatusStep } from '../../types';
import { noticeFromCode } from '../../types';
import { streamMessage, getMessages, deleteMessage as deleteMessageApi, regenerateMessageStream, normalizeSource } from '../services/chat';
import { deleteSession } from '../services/session';
import { queryClient } from '../queryClient';
import { logError } from '../../utils/logError';
import { uuid } from '../../utils/uuid';
import { getDomainLabel } from '../../utils/document';

export interface DomainSelection {
  code: string;
  label: string;
}

interface ChatStore {
  sessionId: string;
  messages: Message[];
  isStreaming: boolean;
  isConnecting: boolean;
  statusText: string | null;
  statusSteps: StatusStep[];
  error: string | null;
  isDeleted: boolean;
  abortController: AbortController | null;
  nextCursor: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  clearError: () => void;
  resetDeleted: () => void;
  abortStream: () => void;
  connect: (sessionId: string) => Promise<void>;
  disconnect: () => void;
  loadMoreMessages: () => Promise<void>;
  sendMessage: (content: string, domain?: DomainSelection, forceNotFirst?: boolean) => Promise<void>;
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

type ServerMessage = {
  message_id?: string; role: 'human' | 'ai'; content: string; created_at?: string;
  domain?: string | null; sources?: Source[]; attachments?: FileAttachment[];
  notice_code?: string | null;
};
const mapServerMessages = (items: ServerMessage[]): Message[] => {
  const mapped: Message[] = items.map((m) => {
    const domainCode = m.role === 'human' && m.domain ? m.domain : undefined;
    return {
      id: m.message_id || uuid(),
      role: m.role === 'human' ? 'user' : 'assistant',
      type: 'text' as const,
      content: extractContent(m.content),
      status: 'done' as const,
      createdAt: m.created_at,
      ...(domainCode ? { domainCode, domainLabel: getDomainLabel(domainCode) } : {}),
      ...(m.sources && m.sources.length > 0
        ? { sources: m.sources.map(normalizeSource) }
        : {}),
      ...(m.attachments && m.attachments.length > 0 ? { attachments: m.attachments } : {}),
      ...(m.role === 'ai' && m.notice_code ? { notice: noticeFromCode(m.notice_code) } : {}),
    };
  });

  const timeOf = (s?: string) => { const n = s ? Date.parse(s) : NaN; return Number.isNaN(n) ? 0 : n; };
  const roleRank = (r: 'user' | 'assistant') => (r === 'user' ? 0 : 1);
  const ordered = [...mapped].sort((a, b) => {
    const ta = timeOf(a.createdAt), tb = timeOf(b.createdAt);
    if (ta !== tb) return ta - tb;
    return roleRank(a.role) - roleRank(b.role);
  });

  const deduped = ordered.filter((msg, i) => {
    if (i === 0) return true;
    const prev = ordered[i - 1];
    return !(
      msg.role === prev.role &&
      msg.type === 'text' && prev.type === 'text' &&
      msg.content === prev.content && msg.createdAt === prev.createdAt
    );
  });

  return deduped.filter(
    (msg) => !(msg.role === 'assistant' && msg.type === 'text' && msg.content.trim() === '')
  );
};

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
      localStorage.setItem(CACHE_KEY(sessionId), JSON.stringify(cacheable))
  } catch (e) { logError('saveCache', e) }
}

const loadCache = (sessionId: string): Message[] => {
  try {
    const raw = localStorage.getItem(CACHE_KEY(sessionId))
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    logError('loadCache', e)
    return []
  }
}

export const clearCache = (sessionId: string) => {
  messageCache.delete(sessionId)
  try { localStorage.removeItem(CACHE_KEY(sessionId)) } catch (e) { logError('clearCache', e) }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    const { sessionId, messages } = useChatStore.getState()
    saveCache(sessionId, messages)
  })
}

const INFLIGHT_KEY = 'rokm_inflight'

export const saveInflight = (sessionId: string, question: string, domain?: DomainSelection) =>
  sessionStorage.setItem(INFLIGHT_KEY, JSON.stringify({ sessionId, question, domain }))

export const clearInflight = (sessionId: string) => {
  try {
    const raw = sessionStorage.getItem(INFLIGHT_KEY)
    if (!raw) return
    if (JSON.parse(raw).sessionId === sessionId) sessionStorage.removeItem(INFLIGHT_KEY)
  } catch (e) { logError('clearInflight', e) }
}

interface InflightData { question: string; domain?: DomainSelection }

const getInflight = (sessionId: string): InflightData | null => {
  try {
    const raw = sessionStorage.getItem(INFLIGHT_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    return data.sessionId === sessionId ? { question: data.question, domain: data.domain } : null
  } catch (e) {
    logError('getInflight', e)
    return null
  }
}

export const useChatStore = create<ChatStore>((set, get) => {
  let connectAbortController = new AbortController();

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
      setAttachments: (attachments: FileAttachment[]) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantId && m.type === 'text' ? { ...m, attachments } : m
          ),
        }))
      },
      setNotice: (notice: Notice) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantId && m.type === 'text' ? { ...m, notice } : m
          ),
        }))
      },
      setStatus: (message: string) => {
        if (get().sessionId !== sessionId) return
        set((state) => {
          const last = state.statusSteps[state.statusSteps.length - 1]
          return {
            statusText: message,
            statusSteps: last?.message === message ? state.statusSteps : [...state.statusSteps, { message }],
          }
        })
      },
      setThought: (thought: string) => {
        if (get().sessionId !== sessionId) return
        set((state) => {
          const steps = state.statusSteps
          if (steps.length === 0) return { statusSteps: [{ message: '생각하는 중', thought }] }
          const next = steps.slice()
          next[next.length - 1] = { ...next[next.length - 1], thought }
          return { statusSteps: next }
        })
      },
    }
  }

  const executeStream = async (
    sessionId: string,
    assistantId: string,
    question: string,
    isFirstMessage: boolean,
    signal: AbortSignal,
    domain?: string,
  ): Promise<void> => {
    const writer = createWriter(sessionId, assistantId)

    try {
      await streamMessage(
        sessionId,
        { question, ...(domain ? { domain } : {}) },
        writer.push,
        signal,
        writer.setSources,
        writer.setStatus,
        writer.setAttachments,
        writer.setNotice,
        writer.setThought,
      )
      writer.flushNow()
    } catch (e) {
      logError('executeStream', e)
      writer.flushNow()
      streamRegistry.delete(sessionId)
      clearInflight(sessionId)
      if (signal.aborted) return
      const viewing = get().sessionId === sessionId
      const liveMsgs = viewing ? get().messages : (streamRegistry.get(sessionId) ?? get().messages)

      if (isFirstMessage) {
        clearCache(sessionId)
        messageCache.delete(sessionId)
        streamRegistry.delete(sessionId)
        deleteSession(sessionId)
          .then(() => queryClient.invalidateQueries({ queryKey: ['sessions'] }))
          .catch((e) => logError('deleteSession', e))
        if (viewing) set({ error: '응답 중 오류가 발생했습니다.', isStreaming: false, abortController: null, isDeleted: true })
        return
      }

      const interrupted = liveMsgs.map((m) =>
        m.id === assistantId && m.type === 'text' ? { ...m, status: 'interrupted' as const } : m
      )
      messageCache.set(sessionId, interrupted)
      if (viewing) {
        set({ error: '응답 중 오류가 발생했습니다.', isStreaming: false, abortController: null, messages: interrupted })
      }
      return
    }

    streamRegistry.delete(sessionId)

    const viewing = get().sessionId === sessionId
    const liveMsgs = viewing ? get().messages : (streamRegistry.get(sessionId) ?? get().messages)
    const finalMsg = liveMsgs.find((m) => m.id === assistantId)
    const hasContent = finalMsg?.type === 'text' && finalMsg.content.trim().length > 0
    if (!hasContent) {
      logError('executeStream.emptyResponse', 'AI 응답에 내용이 없음(빈 응답 — 백엔드 LLM 생성 실패/스킵)', { sessionId, isFirstMessage, viewing })
      clearInflight(sessionId)

      if (isFirstMessage) {
        clearCache(sessionId)
        messageCache.delete(sessionId)
        streamRegistry.delete(sessionId)
        deleteSession(sessionId)
          .then(() => queryClient.invalidateQueries({ queryKey: ['sessions'] }))
          .catch((e) => logError('deleteSession', e))
        if (viewing) set({ error: '응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.', isStreaming: false, abortController: null, isDeleted: true })
        return
      }

      const interrupted = liveMsgs.map((m) =>
        m.id === assistantId && m.type === 'text' ? { ...m, status: 'interrupted' as const } : m
      )
      streamRegistry.delete(sessionId)
      messageCache.set(sessionId, interrupted)
      if (viewing) {
        set({ error: '응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.', isStreaming: false, abortController: null, messages: interrupted })
      }
      return
    }
    clearInflight(sessionId)
    const doneMsgs = liveMsgs.map((m) => m.id === assistantId ? { ...m, status: 'done' as const } : m)
    streamRegistry.delete(sessionId)
    messageCache.set(sessionId, doneMsgs)
    queryClient.invalidateQueries({ queryKey: ['sessions'] })
    if (get().sessionId === sessionId) {
      set({ isStreaming: false, abortController: null, messages: doneMsgs })
    }
  }

  const executeRegenerate = async (
    sessionId: string,
    assistantId: string,
    serverId: string,
    signal: AbortSignal,
  ): Promise<void> => {
    const writer = createWriter(sessionId, assistantId)

    const markInterrupted = (errorMsg?: string) => {
      streamRegistry.delete(sessionId)
      if (get().sessionId !== sessionId) return
      set((state) => ({
        ...(errorMsg ? { error: errorMsg } : {}),
        isStreaming: false,
        abortController: null,
        messages: state.messages.map((m) =>
          m.id === assistantId && m.type === 'text' ? { ...m, status: 'interrupted' as const } : m
        ),
      }))
      messageCache.set(sessionId, get().messages)
    }

    try {
      await regenerateMessageStream(sessionId, serverId, writer.push, signal, writer.setSources, writer.setStatus, writer.setAttachments, writer.setNotice, writer.setThought)
      writer.flushNow()
    } catch (e) {
      logError('executeRegenerate', e)
      writer.flushNow()
      if (signal.aborted) { markInterrupted(); return }
      markInterrupted(isAbortError(e) ? undefined : ((e as Error)?.message || '재생성 중 오류가 발생했습니다.'))
      return
    }

    const liveMsgs = get().sessionId === sessionId ? get().messages : (streamRegistry.get(sessionId) ?? get().messages)
    const finalMsg = liveMsgs.find((m) => m.id === assistantId)
    const hasContent = finalMsg?.type === 'text' && finalMsg.content.trim().length > 0
    if (!hasContent) {
      logError('executeRegenerate.emptyResponse', 'AI 재생성 응답에 내용이 없음(빈 응답)', { sessionId })
      markInterrupted('응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.')
      return
    }

    if (get().sessionId !== sessionId) {
      const done = liveMsgs.map((m) => m.id === assistantId ? { ...m, status: 'done' as const } : m)
      streamRegistry.set(sessionId, done)
      messageCache.set(sessionId, done)
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
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
    isConnecting: false,
    statusText: null,
    statusSteps: [],
    error: null,
    isDeleted: false,
    abortController: null,
    nextCursor: null,
    hasMore: false,
    isLoadingMore: false,

    clearError: () => set({ error: null }),
    resetDeleted: () => set({ isDeleted: false }),

    abortStream: () => {
      set({ statusText: null, statusSteps: [] })
      get().abortController?.abort()
      set((state) => ({
        abortController: null,
        isStreaming: false,
        messages: state.messages.map((m) =>
          m.type === 'text' && m.role === 'assistant' && m.status === 'streaming'
            ? { ...m, status: 'interrupted' as const }
            : m
        ),
      }))
      const sid = get().sessionId
      if (sid) messageCache.set(sid, get().messages)
    },

    connect: async (sessionId: string) => {
      connectAbortController.abort();
      connectAbortController = new AbortController();
      const { signal } = connectAbortController;

      set({ nextCursor: null, hasMore: false, isLoadingMore: false });

      const streaming = streamRegistry.get(sessionId);
      if (streaming) {
        set({ sessionId, messages: streaming, isStreaming: true, isConnecting: false });
        return;
      }
      set({ sessionId, messages: [], isStreaming: false, isConnecting: true, error: null });

      let res;
      try {
        res = await getMessages(sessionId, undefined, { signal });
      } catch (e) {
        if (isAbortError(e)) return;
        set({ isConnecting: false });
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
              { id: uuid(), role: 'user' as const, type: 'text' as const, content: pending.question, createdAt: new Date().toISOString(), domainCode: pending.domain?.code, domainLabel: pending.domain?.label },
            ],
          }));
          get().retryLastMessage();
          return;
        }
        throw e;
      }

      if (get().sessionId !== sessionId || get().isStreaming) return;
      const page = res.data.data;
      const dbMessages = mapServerMessages(page.items);
      set({ nextCursor: page.next_cursor, hasMore: page.has_next });

      const memCached = messageCache.get(sessionId) ?? [];
      const cached = memCached.length > 0 ? memCached : loadCache(sessionId);
      const cachedByContent = new Map<string, { domainCode?: string; domainLabel?: string }>();
      for (const c of cached) {
        if (c.role === 'user' && c.type === 'text' && c.domainLabel) {
          cachedByContent.set(c.content, { domainCode: c.domainCode, domainLabel: c.domainLabel });
        }
      }
      const base = cachedByContent.size === 0 ? dbMessages : dbMessages.map((m) => {
        if (m.role === 'user' && m.type === 'text' && !m.domainLabel) {
          const hit = cachedByContent.get(m.content);
          if (hit) return { ...m, domainCode: hit.domainCode, domainLabel: hit.domainLabel };
        }
        return m;
      });

      const pending = getInflight(sessionId);

      set({ messages: base, isConnecting: false });
      messageCache.set(sessionId, base);

      const last = base[base.length - 1];

      if (last && last.role === 'user' && last.type === 'text') {
        if (pending) {
          get().retryLastMessage();
          return;
        }
        try {
          const recheck = await getMessages(sessionId, undefined, { signal });
          if (get().sessionId !== sessionId) return;
          const items = recheck.data.data.items;
          const serverLast = items[items.length - 1];
          if (serverLast && serverLast.role !== 'human') {
            const remapped = mapServerMessages(items);
            set({ messages: remapped, error: null });
            messageCache.set(sessionId, remapped);
            return;
          }
        } catch (e) { if (isAbortError(e)) return; logError('connect.recheckLast', e); }

        if (get().sessionId !== sessionId) return;
        const interrupted: Message = {
          id: uuid(), role: 'assistant', type: 'text', content: '',
          status: 'interrupted', createdAt: last.createdAt,
        };
        set((state) => ({ messages: [...state.messages, interrupted] }));
        messageCache.set(sessionId, get().messages);
        return;
      }

      if (base.length === 0 && pending) {
        set((state) => ({
          messages: [
            ...state.messages,
            { id: uuid(), role: 'user' as const, type: 'text' as const, content: pending.question, createdAt: new Date().toISOString(), domainCode: pending.domain?.code, domainLabel: pending.domain?.label },
          ],
        }));
        get().retryLastMessage();
        return;
      }

      if (base.length === 0 && !pending && loadCache(sessionId).length === 0) {
        let stillEmpty: boolean;
        try {
          const confirm = await getMessages(sessionId, undefined, { signal });
          stillEmpty = confirm.data.data.items.length === 0;
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
      set({ sessionId: '', messages: [], isStreaming: false, isConnecting: false, statusText: null, statusSteps: [], abortController: null, isDeleted: false, nextCursor: null, hasMore: false, isLoadingMore: false });
    },

    loadMoreMessages: async () => {
      const { sessionId, hasMore, isLoadingMore, nextCursor, messages } = get();
      if (!hasMore || isLoadingMore || !nextCursor || !sessionId) return;

      set({ isLoadingMore: true });
      try {
        const res = await getMessages(sessionId, { cursor: nextCursor });
        if (get().sessionId !== sessionId) return;

        const page = res.data.data;
        const older = mapServerMessages(page.items);
        const existingIds = new Set(messages.map((m) => m.id));
        const prepend = older.filter((m) => !existingIds.has(m.id));
        const merged = [...prepend, ...get().messages];

        set({ messages: merged, nextCursor: page.next_cursor, hasMore: page.has_next });
        messageCache.set(sessionId, merged);
      } catch (e) {
        logError('loadMoreMessages', e);
      } finally {
        if (get().sessionId === sessionId) set({ isLoadingMore: false });
      }
    },

    sendMessage: async (content: string, domain?: DomainSelection, forceNotFirst = false) => {
      if (get().isStreaming) return
      const controller = new AbortController()
      const assistantId = uuid()
      const { sessionId, messages: existingMessages } = get()
      const isFirstMessage = existingMessages.length === 0 && !forceNotFirst

      saveInflight(sessionId, content, domain)
      const now = new Date().toISOString()
      set((state) => ({
        isStreaming: true,
        statusText: null,
        statusSteps: [],
        error: null,
        abortController: controller,
        messages: [
          ...state.messages,
          { id: uuid(), role: 'user', type: 'text', content, createdAt: now, domainCode: domain?.code, domainLabel: domain?.label },
          { id: assistantId, role: 'assistant', type: 'text', content: '', status: 'streaming' as const, createdAt: now },
        ],
      }))
      streamRegistry.set(sessionId, get().messages)
      saveCache(sessionId, get().messages)

      await executeStream(sessionId, assistantId, content, isFirstMessage, controller.signal, domain?.code)
    },

    retryLastMessage: async () => {
      if (get().isStreaming) return
      const { messages, sessionId } = get()
      const last = messages[messages.length - 1]
      if (!last || last.role !== 'user' || last.type !== 'text') return
      const isFirstMessage = messages.length === 1
      const domainCode = last.domainCode
      const domain = last.domainCode && last.domainLabel
        ? { code: last.domainCode, label: last.domainLabel }
        : undefined

      saveInflight(sessionId, last.content, domain)
      const controller = new AbortController()
      const assistantId = uuid()
      const now = new Date().toISOString()
      set((state) => ({
        isStreaming: true,
        statusText: null,
        statusSteps: [],
        error: null,
        abortController: controller,
        messages: [
          ...state.messages,
          { id: assistantId, role: 'assistant', type: 'text', content: '', status: 'streaming' as const, createdAt: now },
        ],
      }))
      streamRegistry.set(sessionId, get().messages)
      saveCache(sessionId, get().messages)

      await executeStream(sessionId, assistantId, last.content, isFirstMessage, controller.signal, domainCode)
    },

    sendImageMessage: (filename: string, caption?: string) => {
      set((state) => ({
        messages: [
          ...state.messages,
          { id: uuid(), role: 'user' as const, type: 'image' as const, filename, caption },
        ],
      }));
    },

    regenerateMessage: async (assistantId: string) => {
      if (get().isStreaming) return;
      const { messages, sessionId } = get();
      const idx = messages.findIndex((m) => m.id === assistantId);
      if (idx === -1) return;
      const target = messages[idx];
      if (target.role !== 'assistant' || target.type !== 'text') return;

      let prevUserId: string | null = null;
      let question: string | null = null;
      let prevDomain: DomainSelection | undefined;
      for (let i = idx - 1; i >= 0; i--) {
        const m = messages[i];
        if (m.role === 'user' && m.type === 'text') {
          prevUserId = m.id;
          question = m.content;
          if (m.domainCode && m.domainLabel) prevDomain = { code: m.domainCode, label: m.domainLabel };
          break;
        }
      }
      if (question == null || prevUserId == null) {
        logError('regenerateMessage.noQuestion', '클릭한 답변 위에서 사용자 질문을 못 찾음(대화 구조 이상)', { assistantId, idx });
        set({ error: '재생성할 원본 질문을 찾을 수 없습니다.' });
        return;
      }

      const qNorm = question.trim();

      const prevUserIdx = messages.findIndex((m) => m.id === prevUserId);
      let occurrence = 0;
      for (let i = 0; i < prevUserIdx; i++) {
        const m = messages[i];
        if (m.role === 'user' && m.type === 'text' && m.content.trim() === qNorm) occurrence++;
      }

      let serverId: string | undefined;
      let serverQuestionId: string | undefined;
      const serverEmptyAnswerIds: string[] = [];
      try {
        const res = await getMessages(sessionId);
        const server = res.data.data.items;
        let seen = 0;
        for (let i = 0; i < server.length; i++) {
          if (server[i].role === 'human' && (server[i].content ?? '').trim() === qNorm) {
            if (seen === occurrence) {
              serverQuestionId = server[i].message_id;
              const next = server[i + 1];
              if (next && next.role !== 'human') {
                if ((next.content ?? '').trim().length > 0) serverId = next.message_id;
                else if (next.message_id) serverEmptyAnswerIds.push(next.message_id);
              }
              break;
            }
            seen++;
          }
        }
      } catch (e) { logError('regenerate.getMessages', e) }

      if (get().sessionId !== sessionId || get().isStreaming) return;

      if (!serverId) {
        const toDelete = [...serverEmptyAnswerIds, ...(serverQuestionId ? [serverQuestionId] : [])];
        if (toDelete.length > 0) {
          await Promise.allSettled(toDelete.map((id) => deleteMessageApi(sessionId, id)));
        }
        const removeIds = new Set<string>([prevUserId, assistantId]);
        const cur = get().messages;
        const prevIdx = cur.findIndex((m) => m.id === prevUserId);
        if (prevIdx !== -1) {
          for (let i = prevIdx; i < cur.length; i++) {
            const m = cur[i];
            const sameQuestion = m.role === 'user' && m.type === 'text' && m.content.trim() === qNorm;
            const emptyAnswer =
              m.role === 'assistant' && m.type === 'text' && m.content.trim() === '';
            if (sameQuestion || emptyAnswer) removeIds.add(m.id);
          }
        }
        const remaining = get().messages.filter((m) => !removeIds.has(m.id));
        set({ messages: remaining });
        messageCache.set(sessionId, remaining);
        if (get().sessionId !== sessionId || get().isStreaming) return;
        await get().sendMessage(question, prevDomain, true);
        return;
      }

      const controller = new AbortController();
      set((state) => ({
        isStreaming: true,
        statusText: null,
        statusSteps: [],
        abortController: controller,
        error: null,
        messages: state.messages.map((m) =>
          m.id === assistantId && m.type === 'text'
            ? { ...m, content: '', sources: undefined, notice: undefined, status: 'streaming' as const }
            : m
        ),
      }));
      streamRegistry.set(sessionId, get().messages);

      await executeRegenerate(sessionId, assistantId, serverId, controller.signal);
    },
  }
});
