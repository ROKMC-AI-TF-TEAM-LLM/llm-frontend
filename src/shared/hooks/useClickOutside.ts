import { useEffect, useEffectEvent, type RefObject } from 'react'

type ElementRef = RefObject<HTMLElement | null>

interface Options {
  /** false면 듣지 않는다 (기본 true) */
  enabled?: boolean
  /** 어떤 누름을 바깥 클릭으로 볼지 (기본 mousedown) */
  event?: 'mousedown' | 'pointerdown'
}

/**
 * ref(여러 개면 그중 어느 것) 바깥을 누르면 onOutside를 부른다. 메뉴·팝오버를 닫을 때 쓴다.
 * 버튼과 떨어져 그려지는 메뉴(포털)는 두 요소의 ref를 배열로 넘긴다.
 */
export function useClickOutside(refs: ElementRef | ElementRef[], onOutside: () => void, { enabled = true, event = 'mousedown' }: Options = {}) {
  const handle = useEffectEvent((e: Event) => {
    const target = e.target as Node
    const inside = (Array.isArray(refs) ? refs : [refs]).some((ref) => ref.current?.contains(target))
    if (!inside) onOutside()
  })

  useEffect(() => {
    if (!enabled) return
    const onDown = (e: Event) => handle(e)
    document.addEventListener(event, onDown)
    return () => document.removeEventListener(event, onDown)
  }, [enabled, event])
}
