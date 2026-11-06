const KEY = 'mars:post-login-redirect'

export function setPostLoginRedirect(path: string) {
  try {
    if (!path.startsWith('/') || path.startsWith('//')) return
    sessionStorage.setItem(KEY, path)
  } catch {
    // 저장소를 못 쓰면 로그인 뒤 기본 화면으로 간다
  }
}

export function takePostLoginRedirect(): string | null {
  try {
    const v = sessionStorage.getItem(KEY)
    if (v) sessionStorage.removeItem(KEY)
    return v && v.startsWith('/') && !v.startsWith('//') ? v : null
  } catch {
    return null
  }
}
