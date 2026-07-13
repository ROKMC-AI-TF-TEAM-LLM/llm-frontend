import { useState, useEffect, useRef } from 'react'
import SessionItem from './SessionItem'
import { SessionItemSkeleton } from '../Skeleton'
import Toast from '../Toast'
import { useInfiniteSessions } from '../../../hooks/useSession'

interface RecentChatsProps {
  isOpen: boolean;
}

// 사이드바 '최근 대화' 섹션. GET /sessions?is_favorite=false 로 즐겨찾기를 제외한 목록을 받는다.
export default function RecentChats({ isOpen }: RecentChatsProps) {
  const [sidebarError, setSidebarError] = useState('')
  const sentinelRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteSessions(false)

  const chats = (data?.pages ?? [])
    .flatMap((page) => page.data.data.items)
    .map((s) => ({ id: s.session_id, title: s.title, isFavorite: false }))

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage()
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div className={`px-[12px] pt-[12px] overflow-hidden transition-opacity duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {sidebarError && <Toast message={sidebarError} onClose={() => setSidebarError('')} />}
      <p className="px-[11px] text-[10.5px] font-extrabold tracking-[0.12em] text-[#c9aab2] mb-2 whitespace-nowrap uppercase">최근 대화</p>

      {isLoading ? (
        <ul className="space-y-0.5">
          {[...Array(6)].map((_, i) => <SessionItemSkeleton key={i} />)}
        </ul>
      ) : (
        <ul className="space-y-0">
          {chats.map((chat) => (
            <SessionItem key={chat.id} chat={chat} onError={setSidebarError} />
          ))}

          {isFetchingNextPage && (
            [...Array(3)].map((_, i) => <SessionItemSkeleton key={`more-${i}`} />)
          )}
        </ul>
      )}

      <div ref={sentinelRef} className="h-2" />
    </div>
  );
}
