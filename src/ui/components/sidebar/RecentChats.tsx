import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ChatItem } from "../../../types";
import { useDeleteSession, useUpdateSession } from '../../../hooks/useSession';
import { SessionItemSkeleton } from '../Skeleton';

interface RecentChatsProps {
  isOpen: boolean;
  chats: ChatItem[];
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  isInitialLoading?: boolean;
}

export default function RecentChats({ isOpen, chats, hasMore, onLoadMore, isLoadingMore, isInitialLoading }: RecentChatsProps) {
  const navigate = useNavigate()
  const { id: currentId } = useParams()
  const { mutate: deleteSession } = useDeleteSession()
  const { mutate: updateSession } = useUpdateSession()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
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

  if (!isOpen) return null;

  const handleEditStart = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(id)
    setEditingTitle(title)
  }

  const handleEditSubmit = (id: string) => {
    if (editingTitle.trim()) {
      updateSession({ sessionId: id, data: { title: editingTitle.trim() } })
    }
    setEditingId(null)
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteSession(id, {
      onSuccess: () => {
        if (id === currentId) navigate('/chat')
      },
    })
  }

  return (
    <div className="px-3 pt-4 overflow-hidden">
      <p className="px-3 text-xs text-text-muted mb-2">최근 대화</p>

      {isInitialLoading ? (
        <ul className="space-y-0.5">
          {[...Array(6)].map((_, i) => <SessionItemSkeleton key={i} />)}
        </ul>
      ) : (
        <ul className="space-y-1">
          {chats.map((chat) => (
            <li key={chat.id} className="group relative">
              {editingId === chat.id ? (
                <input
                  autoFocus
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={() => handleEditSubmit(chat.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditSubmit(chat.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-brand outline-none bg-surface text-text-primary"
                />
              ) : (
                <button
                  onClick={() => navigate(`/chat/${chat.id}`)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-text-primary hover:bg-brand-subtle hover:text-brand transition-colors text-sm text-left pr-16"
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${chat.id === currentId ? 'bg-brand' : 'bg-gray-300'}`} />
                  <span className="truncate">{chat.title}</span>
                </button>
              )}
              {editingId !== chat.id && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1">
                  <button
                    onClick={(e) => handleEditStart(chat.id, chat.title, e)}
                    className="p-1 rounded text-text-muted hover:text-brand transition-colors"
                    aria-label="제목 수정"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDelete(chat.id, e)}
                    className="p-1 rounded text-text-muted hover:text-red-500 transition-colors"
                    aria-label="세션 삭제"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 011-1h4a1 1 0 011 1m-7 0h8" />
                    </svg>
                  </button>
                </div>
              )}
            </li>
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
