import { create } from 'zustand';
import axios from 'axios';
import type { Message, Source, FileAttachment } from '../../types';
import { streamMessage, getMessages, deleteMessage as deleteMessageApi, regenerateMessageStream } from '../services/chat';
import { deleteSession } from '../services/session';
import { queryClient } from '../queryClient';
import { logError } from '../../utils/logError';
import { uuid } from '../../utils/uuid';
import { getDomainLabel } from '../../utils/document';

// 채팅 전송 시 선택한 도메인. code는 서버 요청(domain 필드)용, label은 말풍선 태그 표시용.
// '전체' 검색이면 undefined를 넘긴다.
export interface DomainSelection {
  code: string;
  label: string;
}

interface ChatStore {
  sessionId: string;
  messages: Message[];
  isStreaming: boolean;
  // 세션 진입 후 서버 첫 페이지가 도착할 때까지 true(로딩 오버레이용). 캐시 유무와 무관하게
  // connect 흐름을 한 곳에서 관장해, 빈 화면→최상단 노출('팍 튀는' 진입)을 없앤다.
  isConnecting: boolean;
  statusText: string | null;
  error: string | null;
  isDeleted: boolean;
  abortController: AbortController | null;
  // 위로 스크롤 무한로딩(과거 메시지) 상태.
  //  - nextCursor  : 다음(과거) 페이지 커서. null이면 더 없음
  //  - hasMore     : 과거 메시지가 더 있는지
  //  - isLoadingMore: 과거 페이지 로딩 중(중복 요청 방지)
  nextCursor: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  clearError: () => void;
  resetDeleted: () => void;
  abortStream: () => void;
  connect: (sessionId: string) => Promise<void>;
  disconnect: () => void;
  loadMoreMessages: () => Promise<void>;
  sendMessage: (content: string, domain?: DomainSelection) => Promise<void>;
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

// 서버 MessageItem[] → 화면 Message[] 매핑 + 시간순 정렬 + 인접 중복 제거 + 빈 assistant 제거.
// connect(첫 페이지)와 loadMoreMessages(과거 페이지)가 공유한다.
type ServerMessage = {
  message_id?: string; role: 'human' | 'ai'; content: string; created_at?: string;
  domain?: string | null; sources?: Source[]; attachments?: FileAttachment[];
};
const mapServerMessages = (items: ServerMessage[]): Message[] => {
  const mapped: Message[] = items.map((m) => {
    // 서버가 저장해준 도메인 코드(예: 'HR'). 질문(human) 메시지에만 태그로 붙인다.
    const domainCode = m.role === 'human' && m.domain ? m.domain : undefined;
    return {
      id: m.message_id || uuid(),
      role: m.role === 'human' ? 'user' : 'assistant',
      type: 'text' as const,
      content: extractContent(m.content),
      status: 'done' as const,
      createdAt: m.created_at,
      ...(domainCode ? { domainCode, domainLabel: getDomainLabel(domainCode) } : {}),
      ...(m.sources && m.sources.length > 0 ? { sources: m.sources } : {}),
      ...(m.attachments && m.attachments.length > 0 ? { attachments: m.attachments } : {}),
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

// 메시지 캐시는 localStorage에 둔다 — 탭을 닫았다 열어도 대화 태그(도메인 등) 기록이 남게.
// (입력창의 도메인 '선택'은 임시 상태라 별개로 sessionStorage에 저장한다 — ChatInput.tsx)
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
        // 실제 답변 글자가 도착하면 진행상태 문구는 지운다(로딩 인디케이터가 답변 본문으로 대체됨).
        ...(get().statusText ? { statusText: null } : {}),
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
      // 'files' 이벤트(done 직전 1회)로 온 첨부 목록을 해당 AI 메시지에 세팅한다.
      setAttachments: (attachments: FileAttachment[]) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantId && m.type === 'text' ? { ...m, attachments } : m
          ),
        }))
      },
      setStatus: (message: string) => {
        // 다른 세션으로 이동한 상태면 무시(현재 보고 있는 세션의 스트림만 문구 표시).
        if (get().sessionId !== sessionId) return
        set({ statusText: message })
      },
    }
  }

  const cleanupEmptyExchange = async (sessionId: string, question: string) => {
    try {
      // 최신 페이지에 마지막 질문/빈 답변이 있으므로 첫 페이지만 보면 된다.
      const res = await getMessages(sessionId)
      const server = res.data.data.items
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
      if (server.length - toDelete.length <= 0) {
        const after = await getMessages(sessionId)
        if (after.data.data.items.length === 0) {
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
      )
      writer.flushNow()
    } catch (e) {
      logError('executeStream', e)
      writer.flushNow()
      streamRegistry.delete(sessionId)
      clearInflight(sessionId)
      // 사용자가 중단한 스트림은 abortStream에서 메시지·전역 상태를 이미 마무리했다. 그 사이 새 전송이
      // 시작됐을 수 있으므로, 뒤늦은 이 정리가 새 스트림의 상태를 덮어쓰지 않도록 여기서 끝낸다.
      if (signal.aborted) return
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
      logError('executeStream.emptyResponse', 'AI 응답에 내용이 없음(빈 응답 — 백엔드 LLM 생성 실패/스킵)', { sessionId, isFirstMessage })
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

  const executeRegenerate = async (
    sessionId: string,
    assistantId: string,
    serverId: string,
    signal: AbortSignal,
    backup?: { content: string; sources?: Source[] }, // 재생성 실패/중단 시 원본 답변 복원용
  ): Promise<void> => {
    const writer = createWriter(sessionId, assistantId)

    // 재생성이 빈 채로 끝났고 백업(원래 답변)이 있으면, 답변을 날리지 않고 원본을 복원한다.
    // 백업이 없으면(원래도 빈 답변이었던 경우 등) 기존대로 interrupted 배너를 띄운다.
    const restoreOrInterrupt = (errorMsg?: string) => {
      streamRegistry.delete(sessionId)
      if (get().sessionId !== sessionId) return
      const cur = get().messages.find((m) => m.id === assistantId)
      const curEmpty = !(cur?.type === 'text' && cur.content.trim().length > 0)
      const canRestore = curEmpty && backup && backup.content.trim().length > 0
      set((state) => ({
        ...(errorMsg && !canRestore ? { error: errorMsg } : {}),
        isStreaming: false,
        abortController: null,
        messages: state.messages.map((m) =>
          m.id === assistantId && m.type === 'text'
            ? canRestore
              ? { ...m, content: backup!.content, sources: backup!.sources, status: 'done' as const }
              : { ...m, status: 'interrupted' as const }
            : m
        ),
      }))
      messageCache.set(sessionId, get().messages)
    }

    try {
      await regenerateMessageStream(sessionId, serverId, writer.push, signal, writer.setSources, writer.setStatus, writer.setAttachments)
      writer.flushNow()
    } catch (e) {
      logError('executeRegenerate', e)
      writer.flushNow()
      // 사용자 중단: abortStream이 interrupted로 만들었지만 content가 비었을 수 있으므로 원본을 복원한다.
      if (signal.aborted) { restoreOrInterrupt(); return }
      restoreOrInterrupt(isAbortError(e) ? undefined : ((e as Error)?.message || '재생성 중 오류가 발생했습니다.'))
      return
    }

    const finalMsg = get().messages.find((m) => m.id === assistantId)
    const hasContent = finalMsg?.type === 'text' && finalMsg.content.trim().length > 0
    if (!hasContent) {
      logError('executeRegenerate.emptyResponse', 'AI 재생성 응답에 내용이 없음(빈 응답)', { sessionId })
      // 재생성이 빈 응답 → 원본이 있으면 복원, 없으면 에러 배너.
      restoreOrInterrupt('응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.')
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
    error: null,
    isDeleted: false,
    abortController: null,
    nextCursor: null,
    hasMore: false,
    isLoadingMore: false,

    clearError: () => set({ error: null }),
    resetDeleted: () => set({ isDeleted: false }),

    abortStream: () => {
      set({ statusText: null })
      get().abortController?.abort()
      // 중단 즉시 스트리밍 메시지를 interrupted로 '동기' 마무리한다. 비동기 정리(catch)에만 맡기면 그 사이
      // 새 전송이 끼어들어 '점 2개'가 뜨거나, 뒤늦은 정리가 새 스트림의 isStreaming/abortController를 덮어쓴다.
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

      // 세션이 바뀌면 과거 페이지 상태를 초기화(이전 세션 커서 재사용 방지).
      set({ nextCursor: null, hasMore: false, isLoadingMore: false });

      const streaming = streamRegistry.get(sessionId);
      if (streaming) {
        set({ sessionId, messages: streaming, isStreaming: true, isConnecting: false });
        return;
      }
      // 진입 시엔 이전/캐시 메시지를 렌더하지 않고 '빈 상태 + 로딩'으로 시작한다.
      // (프리뷰를 깔면 UI가 그걸로 먼저 하단 앵커를 끝내버려, 이후 서버 첫 페이지로 교체될 때
      //  다시 안 내려가 '중간부터 열리는' 문제가 생긴다. 로딩 오버레이로 가린 뒤, 서버 첫 페이지가
      //  도착해 isConnecting=false가 되는 순간 한 번에 하단 앵커한다 → '팍 튀는' 노출이 없다.)
      set({ sessionId, messages: [], isStreaming: false, isConnecting: true });

      let res;
      try {
        res = await getMessages(sessionId, undefined, { signal });
      } catch (e) {
        if (isAbortError(e)) return; // 취소는 다음 connect가 이어받으므로 로딩 상태 유지
        set({ isConnecting: false }); // 진짜 실패 → 로딩 종료(에러 UI/캐시 폴백으로 넘어감)
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
      // 커서 페이지네이션: 첫 페이지(최신)만 받고, 과거 방향 커서를 저장해둔다.
      // 렌더 기준은 '항상 서버 첫 페이지'다. (예전엔 캐시가 더 길면 캐시 전체를 썼는데,
      //  그러면 진입 즉시 전체 대화가 다 뜨고 위로 스크롤할 게 없어 페이지네이션이 죽는다.)
      const page = res.data.data;
      const dbMessages = mapServerMessages(page.items);
      set({ nextCursor: page.next_cursor, hasMore: page.has_next });

      // 캐시는 '렌더 소스'가 아니라 '도메인 태그 폴백 이식용'으로만 쓴다.
      // 서버 domain이 없는 옛 메시지에 한해, 캐시에 있던 도메인 태그를 같은 질문(내용 매칭)에 옮겨준다.
      // (개수 매칭은 첫 페이지 vs 전체 캐시라 안 맞으므로, 내용 기준으로 개별 매칭한다.)
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

      // 서버 첫 페이지 반영 = 로딩 종료. 이 set이 반영되는 순간 UI가 하단 앵커를 건다.
      set({ messages: base, isConnecting: false });
      messageCache.set(sessionId, base);

      const last = base[base.length - 1];

      if (last && last.role === 'user' && last.type === 'text') {
        // 마지막이 질문(user)인데 답변(ai)이 없다 = 답변 생성이 실패해 서버에 안 남은 상태.
        // (질문은 전송 즉시 DB 저장돼 재진입/새로고침에도 남지만 답변은 사라짐)
        if (pending) {
          // 아직 보내던 중(inflight)이면 재시도로 이어간다.
          get().retryLastMessage();
        } else {
          // inflight도 없으면 '답변 실패'로 확정 → interrupted 답변을 붙여 '다시 시도' 배너를 띄운다.
          const failed: Message = {
            id: uuid(), role: 'assistant', type: 'text', content: '',
            status: 'interrupted', createdAt: last.createdAt,
          };
          set((state) => ({ messages: [...state.messages, failed], error: '답변 중 오류가 발생했습니다.' }));
          messageCache.set(sessionId, get().messages);
        }
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
      set({ sessionId: '', messages: [], isStreaming: false, isConnecting: false, statusText: null, abortController: null, isDeleted: false, nextCursor: null, hasMore: false, isLoadingMore: false });
    },

    // 위로 스크롤 시 과거 메시지 한 페이지를 이어 붙인다(맨 앞에 prepend).
    loadMoreMessages: async () => {
      const { sessionId, hasMore, isLoadingMore, nextCursor, messages } = get();
      if (!hasMore || isLoadingMore || !nextCursor || !sessionId) return;

      set({ isLoadingMore: true });
      try {
        const res = await getMessages(sessionId, { cursor: nextCursor });
        // 로딩 중 세션이 바뀌었으면 결과를 버린다(엉뚱한 세션에 붙지 않게).
        if (get().sessionId !== sessionId) return;

        const page = res.data.data;
        const older = mapServerMessages(page.items);
        // 이미 있는 메시지 id는 제외하고 과거 메시지를 앞에 붙인다.
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

    sendMessage: async (content: string, domain?: DomainSelection) => {
      if (get().isStreaming) return
      const controller = new AbortController()
      const assistantId = uuid()
      const { sessionId, messages: existingMessages } = get()
      const isFirstMessage = existingMessages.length === 0

      // domain을 함께 저장해야 스트리밍 중 새로고침 시에도 '전체'로 떨어지지 않는다.
      saveInflight(sessionId, content, domain)
      const now = new Date().toISOString()
      set((state) => ({
        isStreaming: true,
        statusText: null,
        abortController: controller,
        messages: [
          ...state.messages,
          { id: uuid(), role: 'user', type: 'text', content, createdAt: now, domainCode: domain?.code, domainLabel: domain?.label },
          { id: assistantId, role: 'assistant', type: 'text', content: '', status: 'streaming' as const, createdAt: now },
        ],
      }))
      streamRegistry.set(sessionId, get().messages)
      saveCache(sessionId, get().messages)

      await executeStream(sessionId, assistantId, content, isFirstMessage, controller.signal, true, domain?.code)
    },

    retryLastMessage: async () => {
      if (get().isStreaming) return
      const { messages, sessionId } = get()
      const last = messages[messages.length - 1]
      if (!last || last.role !== 'user' || last.type !== 'text') return
      const isFirstMessage = messages.length === 1
      const domainCode = last.domainCode
      // 도메인 정보를 유지해 재연결/재시도 시에도 '전체'로 떨어지지 않게 한다.
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
        abortController: controller,
        messages: [
          ...state.messages,
          { id: assistantId, role: 'assistant', type: 'text', content: '', status: 'streaming' as const, createdAt: now },
        ],
      }))
      streamRegistry.set(sessionId, get().messages)
      saveCache(sessionId, get().messages)

      await executeStream(sessionId, assistantId, last.content, isFirstMessage, controller.signal, true, domainCode)
    },

    sendImageMessage: (filename: string, caption?: string) => {
      set((state) => ({
        messages: [
          ...state.messages,
          { id: uuid(), role: 'user' as const, type: 'image' as const, filename, caption },
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

      // 같은 내용의 질문이 여러 번 있을 수 있으므로(예: "안녕"을 반복 전송) content만으로 매칭하면
      // 엉뚱한 답을 재생성한다. → 재생성 대상 질문(prevUserId) '앞'에 동일 질문이 몇 개인지(occurrence)
      // 세고, 서버에서도 같은 순번의 human 질문 다음 ai 답변을 잡는다.
      const prevUserIdx = messages.findIndex((m) => m.id === prevUserId);
      let occurrence = 0;
      for (let i = 0; i < prevUserIdx; i++) {
        const m = messages[i];
        if (m.role === 'user' && m.type === 'text' && m.content.trim() === qNorm) occurrence++;
      }

      let serverId: string | undefined;
      try {
        // 재생성 대상 질문은 대개 화면에 보이는(최신 페이지) 메시지이므로 첫 페이지에서 찾는다.
        const res = await getMessages(sessionId);
        const server = res.data.data.items;
        let seen = 0;
        for (let i = 0; i < server.length; i++) {
          if (server[i].role === 'human' && (server[i].content ?? '').trim() === qNorm) {
            if (seen === occurrence) {
              const next = server[i + 1];
              if (next && next.role !== 'human' && next.message_id) serverId = next.message_id;
              break;
            }
            seen++;
          }
        }
      } catch (e) { logError('regenerate.getMessages', e) }

      if (get().sessionId !== sessionId || get().isStreaming) return;

      // 백엔드에서 그 질문의 답변을 못 찾으면 같은 질문으로 재전송한다(재전송 폴백).
      if (!serverId) {
        const removeIds = new Set<string>([prevUserId, assistantId]);
        set((state) => ({ messages: state.messages.filter((m) => !removeIds.has(m.id)) }));
        await get().sendMessage(question, prevDomain);
        return;
      }

      // 재생성 시작: 원본 답변을 비우고 스트리밍 상태로. 실패 시 복원할 수 있게 원본을 백업해둔다.
      const prevContent = target.content;
      const prevSources = target.sources;
      const controller = new AbortController();
      set((state) => ({
        isStreaming: true,
        statusText: null,
        abortController: controller,
        error: null,
        messages: state.messages.map((m) =>
          m.id === assistantId && m.type === 'text'
            ? { ...m, content: '', sources: undefined, status: 'streaming' as const }
            : m
        ),
      }));
      streamRegistry.set(sessionId, get().messages);

      await executeRegenerate(sessionId, assistantId, serverId, controller.signal, { content: prevContent, sources: prevSources });
    },
  }
});
