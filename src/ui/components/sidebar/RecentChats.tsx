import { useState, useEffect, useRef } from 'react'
import type { ChatItem } from '../../../types'
import SessionItem from './SessionItem'
import { SessionItemSkeleton } from '../Skeleton'
import Toast from '../Toast'

interface RecentChatsProps {
  isOpen: boolean;
  chats: ChatItem[];
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  isInitialLoading?: boolean;
}

export default function RecentChats({ isOpen, chats, hasMore, onLoadMore, isLoadingMore, isInitialLoading }: RecentChatsProps) {
  const [sidebarError, setSidebarError] = useState('')
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !onLoadMore) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoadingMore) onLoadMore()
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, onLoadMore])

  return (
    <div className={`px-[12px] pt-[12px] overflow-hidden transition-opacity duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {sidebarError && <Toast message={sidebarError} onClose={() => setSidebarError('')} />}
      <p className="px-[11px] text-[10.5px] font-extrabold tracking-[0.12em] text-[#c9aab2] mb-2 whitespace-nowrap uppercase">최근 대화</p>

      {isInitialLoading ? (
        <ul className="space-y-0.5">
          {[...Array(6)].map((_, i) => <SessionItemSkeleton key={i} />)}
        </ul>
      ) : (
        <ul className="space-y-0">
          {chats.map((chat) => (
            <SessionItem key={chat.id} chat={chat} onError={setSidebarError} />
          ))}

          {isLoadingMore && (
            [...Array(3)].map((_, i) => <SessionItemSkeleton key={`more-${i}`} />)
          )}
        </ul>
      )}

      <div ref={sentinelRef} className="h-2" />
    </div>
  );
}
