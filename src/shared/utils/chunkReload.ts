const CHUNK_ERROR = /dynamically imported module|module script failed|failed to fetch dynamically|error loading dynamically|loading chunk/i

const CHUNK_RELOAD_KEY = 'rokm_chunk_reload_at'

export const isChunkLoadError = (error: unknown): boolean =>
  error instanceof Error && CHUNK_ERROR.test(error.message || '')

export const tryReloadOnce = (): boolean => {
  try {
    const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0)
    if (Date.now() - last > 10_000) {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()))
      window.location.reload()
      return true
    }
  } catch {
    // 저장소를 못 쓰면 무한 새로고침을 막을 수 없으므로 새로고침하지 않는다
  }
  return false
}
