import { useEffect, useState, type RefObject } from 'react'

/** 요소가 화면에 처음 들어오면 true가 되고, 그 뒤로는 바뀌지 않는다 (등장 애니메이션용) */
export const useInView = (
  ref: RefObject<Element | null>,
  { threshold = 0.12, rootMargin }: { threshold?: number; rootMargin?: string },
) => {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold, rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, threshold, rootMargin])

  return shown
}
