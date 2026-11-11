import { useEffect, type RefObject } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// 겹쳐 뜬 상자들(모달 위의 확인 창). 맨 위 것만 Tab을 처리한다
const stack: HTMLElement[] = []

/**
 * 모달·서랍이 떠 있는 동안 Tab 이동을 그 안에 가둔다.
 * 열릴 때 안쪽에 포커스가 없으면 상자 자체로 옮기고(autoFocus가 있으면 그대로 둔다), 닫히면 원래 있던 곳으로 돌려준다.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active = true,
) {
  useEffect(() => {
    const box = ref.current
    if (!active || !box) return
    const previous = document.activeElement as HTMLElement | null
    if (!box.contains(document.activeElement))
      box.focus({ preventScroll: true })
    stack.push(box)

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || stack[stack.length - 1] !== box) return
      const items = [...box.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null,
      )
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const current = document.activeElement
      if (e.shiftKey && (current === first || !box.contains(current))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (current === last || !box.contains(current))) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      stack.splice(stack.indexOf(box), 1)
      if (previous && document.contains(previous))
        previous.focus({ preventScroll: true })
    }
  }, [ref, active])
}
