import { useEffect, useEffectEvent } from 'react'

/** ESC 키를 누르면 onEscape를 부른다. 메뉴·모달·서랍을 닫을 때 쓴다. enabled가 false면 듣지 않는다 */
export function useEscapeKey(onEscape: () => void, enabled = true) {
  const handle = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === 'Escape') onEscape()
  })

  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => handle(e)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}
