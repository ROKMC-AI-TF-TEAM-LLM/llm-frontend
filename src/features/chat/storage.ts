import { type Message } from './types';
import { logError } from '@/shared/utils/logError';
import { CHAT_CACHE_PREFIX, CHAT_INFLIGHT_KEY, chatMemoryCache, clearChatCache, isChatStorageLocked } from '@/shared/utils/chatStorage';
import { type DomainSelection } from './store/types';

export const messageCache = chatMemoryCache as Map<string, Message[]>;

const CACHE_KEY = (id: string) => `${CHAT_CACHE_PREFIX}${id}`

export const saveCache = (sessionId: string, messages: Message[]) => {
  // 로그아웃으로 정리된 뒤에는 다시 쓰지 않는다(페이지를 떠날 때 beforeunload가 호출).
  if (!sessionId || messages.length === 0 || isChatStorageLocked()) return
  try {
    const cacheable = messages.filter(
      (m) => !(m.type === 'text' && m.role === 'assistant' && m.status === 'streaming')
    )
    if (cacheable.length > 0)
      localStorage.setItem(CACHE_KEY(sessionId), JSON.stringify(cacheable))
  } catch (e) { logError('saveCache', e) }
}

/** 페이지를 떠날 때 보고 있던 대화를 저장한다 */
export const saveCacheOnUnload = (getCurrent: () => { sessionId: string; messages: Message[] }) => {
  if (typeof window === 'undefined') return
  window.addEventListener('beforeunload', () => {
    const { sessionId, messages } = getCurrent()
    saveCache(sessionId, messages)
  })
}

export const loadCache = (sessionId: string): Message[] => {
  try {
    const raw = localStorage.getItem(CACHE_KEY(sessionId))
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    logError('loadCache', e)
    return []
  }
}

export const clearCache = clearChatCache

const INFLIGHT_KEY = CHAT_INFLIGHT_KEY

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

export const getInflight = (sessionId: string): InflightData | null => {
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
