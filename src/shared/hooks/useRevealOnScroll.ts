import { useEffect, type RefObject } from 'react'

/**
 * `.mars-reveal` 요소가 화면에 들어오면 `is-shown` 클래스를 붙인다(intro.css의 등장 애니메이션).
 * containerRef를 주면 그 안에서만, 없으면 문서 전체에서 찾는다.
 */
export const useRevealOnScroll = (
  containerRef?: RefObject<HTMLElement | null>,
) => {
  useEffect(() => {
    const root = containerRef ? containerRef.current : document
    if (!root) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-shown')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.15 },
    )
    root.querySelectorAll('.mars-reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [containerRef])
}
