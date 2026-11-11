import { useState } from 'react'
import type { ProjectChat } from '../types'
import { displaySessionTitle } from '@/features/sessions/utils'
import { EditIcon, StarIcon, TrashIcon } from '@/shared/components/icons'

export function ChatRow({
  chat,
  active = false,
  onClick,
  onToggleFavorite,
  onRename,
  onDelete,
}: {
  chat: ProjectChat
  active?: boolean
  onClick?: () => void
  onToggleFavorite?: () => void
  onRename?: (next: string) => void
  onDelete?: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(chat.title)
  const { text, isUntitled } = displaySessionTitle(chat.title)

  const hoverBg = active ? '#fdedf2' : '#fdf6f7'

  const submit = () => {
    const next = draft.trim()
    if (next && next !== chat.title) onRename?.(next)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="px-1 py-1">
        <input
          autoFocus
          spellCheck={false}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={submit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
            if (e.key === 'Escape') setEditing(false)
          }}
          className="w-full rounded-[8px] border border-[#f0e6e8] bg-white px-2.5 py-2 text-[13px] text-text-primary outline-none focus:border-brand"
        />
      </div>
    )
  }

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        style={active ? { background: '#fdedf2' } : {}}
        className={`flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-left transition-colors ${
          active ? '' : 'hover:bg-[#fdf6f7]'
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate text-[13px] ${
            isUntitled
              ? 'text-text-muted'
              : active
                ? 'font-bold text-[#c0002a]'
                : 'font-medium text-text-primary'
          }`}
        >
          {text}
        </span>
        <span className="shrink-0 text-[11.5px] text-text-muted transition-opacity group-hover:opacity-0">
          {chat.updatedAt}
        </span>
      </button>

      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-24 rounded-r-[10px] opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: `linear-gradient(to right, transparent 0%, ${hoverBg} 45%)` }}
      />

      <div className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 group-hover:flex">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite?.()
          }}
          aria-label={chat.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          className={`rounded-[7px] p-1.5 transition-colors ${
            chat.isFavorite ? 'text-brand' : 'text-text-muted hover:text-brand'
          } hover:bg-white`}
        >
          <StarIcon className="h-3.5 w-3.5" fill={chat.isFavorite ? 'currentColor' : 'none'} strokeWidth={1.9} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setDraft(chat.title)
            setEditing(true)
          }}
          aria-label="이름 변경"
          className="rounded-[7px] p-1.5 text-text-muted transition-colors hover:bg-white hover:text-brand"
        >
          <EditIcon className="h-3.5 w-3.5" strokeWidth={1.9} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete?.()
          }}
          aria-label="대화 삭제"
          className="rounded-[7px] p-1.5 text-text-muted transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <TrashIcon className="h-3.5 w-3.5" strokeWidth={1.9} />
        </button>
      </div>
    </div>
  )
}
