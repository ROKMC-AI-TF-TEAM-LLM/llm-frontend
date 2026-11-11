import { useEffect, useEffectEvent } from 'react'

interface Options {
  /** true면 이 훅만 ESC를 받는다. 다른 모달 위에 뜨는 창(확인 창)이 아래 것까지 닫지 않게 할 때 쓴다 */
  exclusive?: boolean
}

/** ESC 키를 누르면 onEscape를 부른다. 메뉴·모달·서랍을 닫을 때 쓴다. enabled가 false면 듣지 않는다 */
export function useEscapeKey(
  onEscape: () => void,
  enabled = true,
  { exclusive = false }: Options = {},
) {
  const handle = useEffectEvent((e: KeyboardEvent) => {
    if (e.key !== 'Escape') return
    if (exclusive) e.stopPropagation()
    onEscape()
  })

  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => handle(e)
    // exclusive는 캡처 단계에서 먼저 받아 전파를 막는다
    window.addEventListener('keydown', onKey, exclusive)
    return () => window.removeEventListener('keydown', onKey, exclusive)
  }, [enabled, exclusive])
}
