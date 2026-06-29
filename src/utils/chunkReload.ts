// 코드 스플리팅된 페이지(청크) 로드 실패 처리 유틸.
// 새 배포/HMR로 청크가 stale 되면 동적 import가 실패하는데, 새로고침하면 최신 모듈을 받아 복구된다.

const CHUNK_ERROR = /dynamically imported module|module script failed|failed to fetch dynamically|error loading dynamically|loading chunk/i

const CHUNK_RELOAD_KEY = 'rokm_chunk_reload_at'

export const isChunkLoadError = (error: unknown): boolean =>
  error instanceof Error && CHUNK_ERROR.test(error.message || '')

// 최근(10초 내)에 새로고침한 적 없으면 1회만 새로고침(무한 루프 방지).
export const tryReloadOnce = (): boolean => {
  try {
    const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0)
    if (Date.now() - last > 10_000) {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()))
      window.location.reload()
      return true
    }
  } catch {
    /* sessionStorage 접근 불가 시 무시 */
  }
  return false
}
