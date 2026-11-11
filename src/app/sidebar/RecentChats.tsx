import { useState } from 'react'
import type { ChatItem } from '@/features/chat/types'
import SessionItem from './SessionItem'
import { SessionItemSkeleton } from '@/shared/components/Skeleton'
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll'
import { ChevronDownIcon } from '@/shared/components/icons'

interface RecentChatsProps {
  isOpen: boolean
  chats: ChatItem[]
  hasMore?: boolean
  onLoadMore?: () => void
  isLoadingMore?: boolean
  isInitialLoading?: boolean
}

export default function RecentChats({
  isOpen,
  chats,
  hasMore,
  onLoadMore,
  isLoadingMore,
  isInitialLoading,
}: RecentChatsProps) {
  const [expanded, setExpanded] = useState(true)
  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    hasMore: !!hasMore,
    isLoading: !!isLoadingMore,
    onLoadMore: () => onLoadMore?.(),
    enabled: !!onLoadMore && expanded,
    threshold: 0.1,
  })

  return (
    <div
      className={`px-[12px] pt-[12px] overflow-hidden transition-opacity duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="mb-1 flex w-full items-center gap-1 rounded-[7px] px-[8px] py-[3px] text-left transition-colors hover:bg-brand-tint"
      >
        <span className="text-[10.5px] mars-brand-serif font-extrabold uppercase tracking-[0.12em] text-rose-muted whitespace-nowrap">
          최근 대화
        </span>
        <ChevronDownIcon
          className={`h-3 w-3 shrink-0 text-rose-muted transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`}
          strokeWidth={2.6}
        />
      </button>

      {expanded && (
        <>
          {isInitialLoading ? (
            <ul className="space-y-0.5">
              {[...Array(6)].map((_, i) => (
                <SessionItemSkeleton key={i} />
              ))}
            </ul>
          ) : (
            <ul className="space-y-0">
              {chats.map((chat) => (
                <SessionItem key={chat.id} chat={chat} />
              ))}

              {isLoadingMore &&
                [...Array(3)].map((_, i) => (
                  <SessionItemSkeleton key={`more-${i}`} />
                ))}
            </ul>
          )}

          <div ref={sentinelRef} className="h-2" />
        </>
      )}
    </div>
  )
}
