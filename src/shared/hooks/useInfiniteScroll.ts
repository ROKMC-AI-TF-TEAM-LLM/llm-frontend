import { useEffect, useEffectEvent, useState } from 'react'

interface Options {
  /** 더 불러올 것이 있는지 */
  hasMore: boolean
  /** 지금 불러오는 중인지 (중복 요청 방지) */
  isLoading: boolean
  onLoadMore: () => void
  /** false면 지켜보지 않는다 (기본 true) */
  enabled?: boolean
  /** 감시 요소가 얼마나 보여야 불러올지 (IntersectionObserver threshold) */
  threshold?: number
  /** 화면에 닿기 전에 미리 불러올 여유 (IntersectionObserver rootMargin) */
  rootMargin?: string
}

/**
 * 목록 끝의 감시 요소가 화면에 들어오면 다음 쪽을 불러온다.
 * 돌려주는 ref를 목록 끝의 빈 요소에 단다. 그 요소가 사라졌다 다시 생겨도(접기·검색) 새 요소를 다시 지켜본다.
 */
export function useInfiniteScroll<T extends Element>({ hasMore, isLoading, onLoadMore, enabled = true, threshold, rootMargin }: Options) {
  const [sentinel, setSentinel] = useState<T | null>(null)
  const loadMore = useEffectEvent(onLoadMore)

  useEffect(() => {
    if (!sentinel || !enabled || !hasMore || isLoading) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore()
      },
      { threshold, rootMargin },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [sentinel, enabled, hasMore, isLoading, threshold, rootMargin])

  return setSentinel
}
