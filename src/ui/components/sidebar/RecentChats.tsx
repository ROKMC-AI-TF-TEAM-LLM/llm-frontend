import { useState, useEffect, useRef } from 'react'
import type { ChatItem } from '../../../types'
import SessionItem from './SessionItem'
import { SessionItemSkeleton } from '../Skeleton'
import { showToast } from '../../../api/store/toastStore'
import ProjectChatItem from './ProjectChatItem'
import { useProjectStore } from '../../../features/projects/projectStore'

interface RecentChatsProps {
  isOpen: boolean;
  chats: ChatItem[];
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  isInitialLoading?: boolean;
}

export default function RecentChats({ isOpen, chats, hasMore, onLoadMore, isLoadingMore, isInitialLoading }: RecentChatsProps) {
  const [expanded, setExpanded] = useState(true)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const projects = useProjectStore((s) => s.projects)
  const projectChats = projects.flatMap((p) =>
    p.chats.map((c) => ({
      id: c.id,
      title: c.title,
      updatedAt: c.updatedAt,
      projectId: p.id,
      projectName: p.name,
    })),
  )

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !onLoadMore || !expanded) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoadingMore) onLoadMore()
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, onLoadMore, expanded])

  return (
    <div className={`px-[12px] pt-[12px] overflow-hidden transition-opacity duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="mb-1 flex w-full items-center gap-1 rounded-[7px] px-[8px] py-[3px] text-left transition-colors hover:bg-[#fdedf2]"
      >
        <span className="text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-[#c9aab2] whitespace-nowrap">
          최근 대화
        </span>
        <svg
          className={`h-3 w-3 shrink-0 text-[#c9aab2] transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <>
          {isInitialLoading ? (
            <ul className="space-y-0.5">
              {[...Array(6)].map((_, i) => <SessionItemSkeleton key={i} />)}
            </ul>
          ) : (
            <ul className="space-y-0">
              {projectChats.map((c) => (
                <ProjectChatItem key={`${c.projectId}-${c.id}`} chat={c} />
              ))}

              {chats.map((chat) => (
                <SessionItem key={chat.id} chat={chat} onError={showToast} />
              ))}

              {isLoadingMore && (
                [...Array(3)].map((_, i) => <SessionItemSkeleton key={`more-${i}`} />)
              )}
            </ul>
          )}

          <div ref={sentinelRef} className="h-2" />
        </>
      )}
    </div>
  );
}
