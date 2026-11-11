import { logError } from './logError'

// 브라우저에 남기는 대화 데이터의 키. chatStore와 로그아웃 정리가 같은 이름을 쓰도록 여기서 정의한다.
export const CHAT_CACHE_PREFIX = 'rokm_cache_'
export const CHAT_INFLIGHT_KEY = 'rokm_inflight'

// 정리한 뒤에는 페이지를 떠날 때(beforeunload) 현재 대화를 다시 저장하지 않게 막는다.
let locked = false
export const isChatStorageLocked = (): boolean => locked

// 로그아웃(직접 로그아웃 · 토큰 만료로 인한 강제 로그아웃) 시 호출한다.
// 대화 내용은 localStorage에 남으므로, 지우지 않으면 같은 PC의 다음 사용자가 읽을 수 있다.
export const clearStoredChatData = (): void => {
  locked = true
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(CHAT_CACHE_PREFIX)) keys.push(key)
    }
    keys.forEach((key) => localStorage.removeItem(key))
    sessionStorage.removeItem(CHAT_INFLIGHT_KEY)
  } catch {
    // 저장소 접근이 막힌 환경(사생활 보호 모드 등): 지울 것도 없다.
  }
}

// 대화별 메시지의 메모리 캐시. 담는 값의 타입은 쓰는 쪽(features/chat/storage)이 정한다.
export const chatMemoryCache = new Map<string, unknown>()

/** 한 대화의 캐시(메모리·localStorage)를 지운다. 대화를 삭제할 때 부른다 */
export const clearChatCache = (sessionId: string) => {
  chatMemoryCache.delete(sessionId)
  try {
    localStorage.removeItem(`${CHAT_CACHE_PREFIX}${sessionId}`)
  } catch (e) {
    logError('clearCache', e)
  }
}
