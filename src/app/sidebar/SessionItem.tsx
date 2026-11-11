import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ChatItem } from '@/features/chat/types'
import { useConfirmDeleteSession, useUpdateSession, useToggleFavorite } from '@/features/sessions/hooks'
import { displaySessionTitle } from '@/features/sessions/utils'
import { EditIcon, StarAltIcon, TrashIcon } from '@/shared/components/icons'

const HOVER_BG = '#fdedf2'

interface SessionItemProps {
  chat: ChatItem
}

// 실패 알림은 각 mutation 훅에서 띄운다(행이 언마운트돼도 알림이 남도록).
export default function SessionItem({ chat }: SessionItemProps) {
  const navigate = useNavigate()
  const { id: routeId, chatId: routeChatId } = useParams()
  const currentId = routeChatId ?? routeId
  const { mutate: updateSession } = useUpdateSession()
  const confirmDelete = useConfirmDeleteSession()
  const { mutate: toggleFavorite } = useToggleFavorite()

  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(chat.title)

  const isActive = chat.id === currentId
  const { text: titleText, isUntitled } = displaySessionTitle(chat.title)

  const submitEdit = () => {
    const next = draft.trim()
    if (next && next !== chat.title) {
      updateSession({ sessionId: chat.id, data: { title: next } })
    }
    setIsEditing(false)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    confirmDelete({ id: chat.id, title: chat.title, projectId: chat.projectId })
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
          className="w-full px-[8px] py-[7px] text-sm rounded-lg border border-surface-border focus:border-brand focus:ring-1 focus:ring-brand outline-none bg-surface text-text-primary"
        />
      </li>
    )
  }

  return (
    <li className="group relative">
      <button
        onClick={() => navigate(chat.projectId ? `/projects/${chat.projectId}/${chat.id}` : `/chat/${chat.id}`)}
        style={isActive ? { background: HOVER_BG, color: '#c0002a' } : {}}
        className={`w-full flex items-center px-[8px] py-[7px] rounded-[9px] text-[13px] text-left transition-colors relative ${
          isActive ? 'font-bold' : 'text-[#1a1917] font-medium hover:bg-[#fdedf2] hover:text-[#c0002a]'
        }`}
      >
        <span className={`truncate overflow-hidden ${isUntitled ? 'text-text-muted font-normal' : ''}`}>
          {titleText}
        </span>
      </button>

      <span
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-32 rounded-r-[9px] opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{ background: `linear-gradient(to right, rgba(253,237,242,0) 0%, ${HOVER_BG} 35%)` }}
      />

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
          <StarAltIcon className="w-3 h-3" fill={chat.isFavorite ? 'currentColor' : 'none'} strokeWidth={2.2} />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); setDraft(chat.title); setIsEditing(true) }}
          className="p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-brand-subtle transition-colors"
          aria-label="제목 수정"
        >
          <EditIcon className="w-3 h-3" strokeWidth={2.2} />
        </button>

        <button
          onClick={handleDelete}
          className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
          aria-label="세션 삭제"
        >
          <TrashIcon className="w-3 h-3" strokeWidth={2.2} />
        </button>
      </div>
    </li>
  )
}
