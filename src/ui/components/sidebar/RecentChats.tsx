import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ChatItem } from "../../../types";
import type { ApiError } from '../../../utils/error';
import { useDeleteSession, useUpdateSession } from '../../../hooks/useSession';
import { clearCache } from '../../../api/store/chatStore';
import { SessionItemSkeleton } from '../Skeleton';
import Toast from '../Toast';

interface RecentChatsProps {
  isOpen: boolean;
  chats: ChatItem[];
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  isInitialLoading?: boolean;
}

const SESSION_ERRORS: Record<string, string> = {
  SESSION_NOT_FOUND: '세션을 찾을 수 없습니다.',
  SESSION_ACCESS_DENIED: '접근 권한이 없습니다.',
  UNAUTHORIZED: '인증이 만료되었습니다. 다시 로그인해주세요.',
};

const getSessionError = (error: unknown): string => {
  const code = (error as ApiError)?.response?.data?.error?.code;
  return (code ? SESSION_ERRORS[code] : undefined) ?? '오류가 발생했습니다.';
};

export default function RecentChats({ isOpen, chats, hasMore, onLoadMore, isLoadingMore, isInitialLoading }: RecentChatsProps) {
  const navigate = useNavigate()
  const { id: currentId } = useParams()
  const { mutate: deleteSession } = useDeleteSession()
  const { mutate: updateSession } = useUpdateSession()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
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

  const handleEditSubmit = (id: string) => {
    if (editingTitle.trim()) {
      updateSession(
        { sessionId: id, data: { title: editingTitle.trim() } },
        {
          onSuccess: () => setSidebarError(''),
          onError: (e) => setSidebarError(getSessionError(e)),
        },
      )
    }
    setEditingId(null)
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteSession(id, {
      onSuccess: () => {
        setSidebarError('');
        clearCache(id);
        if (id === currentId) navigate('/chat')
      },
      onError: (e) => setSidebarError(getSessionError(e)),
    })
  }

  return (
    <div className={`px-3 pt-4 overflow-hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {sidebarError && <Toast message={sidebarError} onClose={() => setSidebarError('')} />}
      <p className="px-3 text-xs text-text-muted mb-2 whitespace-nowrap">최근 대화</p>

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
                  spellCheck={false}
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={() => handleEditSubmit(chat.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditSubmit(chat.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="w-full px-3 py-[7px] text-sm rounded-lg border border-surface-border focus:border-brand focus:ring-1 focus:ring-brand outline-none bg-surface text-text-primary"
                />
              ) : (
                <button
                  onClick={() => navigate(`/chat/${chat.id}`)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-text-primary hover:bg-brand-subtle hover:text-brand transition-colors text-sm text-left pr-16"
                >
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${chat.id === currentId ? 'bg-brand' : 'bg-gray-300'}`} />
                  <span className="truncate">{chat.title}</span>
                </button>
              )}
              {editingId !== chat.id && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingId(chat.id); setEditingTitle(chat.title); }}
                    className="p-1 rounded text-text-muted hover:text-brand transition-colors"
                    aria-label="제목 수정"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDelete(chat.id, e)}
                    className="p-1 rounded text-text-muted hover:text-red-500 transition-colors"
                    aria-label="세션 삭제"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
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
