import { useState, useEffect, useRef } from 'react'
import SessionItem from './SessionItem'
import { SessionItemSkeleton } from '../Skeleton'
import Toast from '../Toast'
import { useInfiniteSessions } from '../../../hooks/useSession'

interface FavoriteChatsProps {
  isOpen: boolean
}

// 사이드바 '즐겨찾기' 섹션. GET /sessions?is_favorite=true 로 전용 목록을 받는다.
// (세션 목록에서 필터링하면 아직 로드 안 된 페이지의 즐겨찾기가 누락되므로 API를 분리했다)
export default function FavoriteChats({ isOpen }: FavoriteChatsProps) {
  const [sidebarError, setSidebarError] = useState('')
  const sentinelRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteSessions(true)

  const favorites = (data?.pages ?? [])
    .flatMap((page) => page.data.data.items)
    .map((s) => ({ id: s.session_id, title: s.title, isFavorite: true }))

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage()
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // 로딩 중이 아니고 즐겨찾기가 하나도 없으면 섹션 자체를 렌더하지 않는다.
  if (!isLoading && favorites.length === 0) return null

  return (
    <div
      className={`px-[12px] pt-[12px] overflow-hidden transition-opacity duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {sidebarError && <Toast message={sidebarError} onClose={() => setSidebarError('')} />}
      <p className="px-[11px] text-[10.5px] font-extrabold tracking-[0.12em] text-[#c9aab2] mb-2 whitespace-nowrap uppercase">
        즐겨찾기
      </p>

      {isLoading ? (
        <ul className="space-y-0.5">
          {[...Array(2)].map((_, i) => <SessionItemSkeleton key={i} />)}
        </ul>
      ) : (
        <ul className="space-y-0">
          {favorites.map((chat) => (
            <SessionItem key={chat.id} chat={chat} onError={setSidebarError} />
          ))}
          {isFetchingNextPage && <SessionItemSkeleton />}
        </ul>
      )}

      <div ref={sentinelRef} className="h-2" />
    </div>
  )
}
