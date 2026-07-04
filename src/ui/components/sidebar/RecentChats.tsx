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
    <div className={`px-[12px] pt-[12px] overflow-hidden transition-opacity duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {sidebarError && <Toast message={sidebarError} onClose={() => setSidebarError('')} />}
      <p className="px-[11px] text-[10.5px] font-extrabold tracking-[0.12em] text-[#c9aab2] mb-2 whitespace-nowrap uppercase">최근 대화</p>

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
                  style={
                    chat.id === currentId
                      ? { background: '#fdedf2', color: '#c0002a' }
                      : {}
                  }
                  className={`w-full flex items-center gap-[9px] px-[11px] py-[7px] rounded-[9px] text-[13px] text-left transition-colors group/item relative pr-12 ${
                    chat.id === currentId
                      ? 'font-bold'
                      : 'text-[#5a5560] font-medium hover:bg-[#fdedf2] hover:text-[#c0002a]'
                  }`}
                >
                  <span
                    style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: chat.id === currentId ? '#e4002b' : '#d9c3c9', transition: 'background 0.2s' }}
                  />
                  <span className="truncate overflow-hidden">{chat.title}</span>
                </button>
              )}
              {editingId !== chat.id && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingId(chat.id); setEditingTitle(chat.title); }}
                    className="p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-brand-subtle transition-colors"
                    aria-label="제목 수정"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDelete(chat.id, e)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                    aria-label="세션 삭제"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
