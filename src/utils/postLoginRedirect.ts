/**
 * 로그인 후 돌아갈 목적지 기억하기.
 *
 * 랜딩 푸터에서 "문서 검색" 같은 보호된 메뉴를 누르면 로그인 화면이 열리는데,
 * 로그인에 성공했을 때 무작정 /chat으로 보내면 사용자가 원래 누른 곳이 아니다.
 * → 누를 때 목적지를 적어 두고, 로그인 직후 그리로 보낸다.
 *
 * sessionStorage를 쓰는 이유: 로그인 폼을 오가는 동안은 값이 남고,
 * 탭을 닫으면 저절로 사라져 남은 값이 다음 방문을 오염시키지 않는다.
 */
const KEY = 'mars:post-login-redirect'

/** 로그인 후 이동할 앱 내부 경로를 저장한다. */
export function setPostLoginRedirect(path: string) {
  try {
    // 앱 내부 경로만 허용 — '//evil.com' 같은 외부 주소로 튕겨나가지 않게 막는다.
    if (!path.startsWith('/') || path.startsWith('//')) return
    sessionStorage.setItem(KEY, path)
  } catch {
    // 프라이빗 모드 등에서 sessionStorage가 막혀 있어도 로그인 자체는 계속돼야 한다.
  }
}

/** 저장된 목적지를 꺼내면서 지운다(한 번만 쓰인다). */
export function takePostLoginRedirect(): string | null {
  try {
    const v = sessionStorage.getItem(KEY)
    if (v) sessionStorage.removeItem(KEY)
    return v && v.startsWith('/') && !v.startsWith('//') ? v : null
  } catch {
    return null
  }
}
