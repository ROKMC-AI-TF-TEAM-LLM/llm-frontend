import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ChatItem } from '../../../types'
import type { ApiError } from '../../../utils/error'
import { useDeleteSession, useUpdateSession, useToggleFavorite } from '../../../hooks/useSession'
import { clearCache } from '../../../api/store/chatStore'

const SESSION_ERRORS: Record<string, string> = {
  SESSION_NOT_FOUND: '세션을 찾을 수 없습니다.',
  SESSION_ACCESS_DENIED: '접근 권한이 없습니다.',
  UNAUTHORIZED: '인증이 만료되었습니다. 다시 로그인해주세요.',
}

const getSessionError = (error: unknown): string => {
  const code = (error as ApiError)?.response?.data?.error?.code
  return (code ? SESSION_ERRORS[code] : undefined) ?? '오류가 발생했습니다.'
}

// hover 시 나타나는 액션(별/수정/삭제) 영역의 배경색 = 아이템 hover/active 배경색.
// 제목이 길 때 이 색으로 페이드아웃시켜 글자가 버튼 밑으로 '잘려 겹치는' 대신 자연스럽게 사라지게 한다.
const HOVER_BG = '#fdedf2'

interface SessionItemProps {
  chat: ChatItem
  /** 에러 토스트를 띄울 부모 콜백 (빈 문자열이면 해제) */
  onError: (msg: string) => void
}

// 사이드바 세션 한 줄. '최근 대화'와 '즐겨찾기' 섹션이 동일한 동작을 갖도록 공용화했다.
export default function SessionItem({ chat, onError }: SessionItemProps) {
  const navigate = useNavigate()
  const { id: currentId } = useParams()
  const { mutate: updateSession } = useUpdateSession()
  const { mutate: deleteSession } = useDeleteSession()
  const { mutate: toggleFavorite } = useToggleFavorite()

  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(chat.title)

  const isActive = chat.id === currentId

  const submitEdit = () => {
    const next = draft.trim()
    if (next && next !== chat.title) {
      updateSession(
        { sessionId: chat.id, data: { title: next } },
        { onSuccess: () => onError(''), onError: (e) => onError(getSessionError(e)) },
      )
    }
    setIsEditing(false)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteSession(chat.id, {
      onSuccess: () => {
        onError('')
        clearCache(chat.id)
        if (chat.id === currentId) navigate('/chat')
      },
      onError: (e) => onError(getSessionError(e)),
    })
  }

  if (isEditing) {
    return (
      <li>
        <input
          autoFocus
          spellCheck={false}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={submitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitEdit()
            if (e.key === 'Escape') setIsEditing(false)
          }}
          className="w-full px-3 py-[7px] text-sm rounded-lg border border-surface-border focus:border-brand focus:ring-1 focus:ring-brand outline-none bg-surface text-text-primary"
        />
      </li>
    )
  }

  return (
    <li className="group relative">
      <button
        onClick={() => navigate(`/chat/${chat.id}`)}
        style={isActive ? { background: HOVER_BG, color: '#c0002a' } : {}}
        className={`w-full flex items-center px-[11px] py-[7px] rounded-[9px] text-[13px] text-left transition-colors relative ${
          isActive ? 'font-bold' : 'text-[#5a5560] font-medium hover:bg-[#fdedf2] hover:text-[#c0002a]'
        }`}
      >
        <span className="truncate overflow-hidden">{chat.title}</span>
      </button>

      {/* 페이드: 제목이 액션 버튼과 겹치는 구간을 배경색으로 자연스럽게 가린다(hover 시에만). */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-32 rounded-r-[9px] opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{ background: `linear-gradient(to right, rgba(253,237,242,0) 0%, ${HOVER_BG} 35%)` }}
      />

      {/* 액션: 즐겨찾기 / 제목 수정 / 삭제 */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite({ sessionId: chat.id, next: !chat.isFavorite })
          }}
          className={`p-1.5 rounded-lg transition-colors hover:bg-brand-subtle ${
            chat.isFavorite ? 'text-[#e4b100]' : 'text-text-muted hover:text-[#e4b100]'
          }`}
          aria-label={chat.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        >
          {/* 즐겨찾기면 채워진 별, 아니면 빈 별 */}
          <svg
            className="w-3 h-3"
            viewBox="0 0 24 24"
            fill={chat.isFavorite ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2l2.9 6.26 6.6.72-4.9 4.6 1.35 6.42L12 16.9 6.05 20l1.35-6.42L2.5 8.98l6.6-.72L12 2z" />
          </svg>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); setDraft(chat.title); setIsEditing(true) }}
          className="p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-brand-subtle transition-colors"
          aria-label="제목 수정"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </button>

        <button
          onClick={handleDelete}
          className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
          aria-label="세션 삭제"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </li>
  )
}
