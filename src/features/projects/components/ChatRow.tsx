import { useState } from 'react'
import type { ProjectChat } from '../types'
import { displaySessionTitle } from '@/features/sessions/utils'
import { EditIcon, StarIcon, TrashIcon } from '@/shared/components/icons'
import IconButton from '@/shared/components/IconButton'

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

  const hoverBg = active ? 'var(--color-brand-tint)' : 'var(--color-rose-hover)'

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
          className="w-full rounded-[8px] border border-rose-border bg-white px-2.5 py-2 text-13 text-text-primary outline-none focus:border-brand"
        />
      </div>
    )
  }

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        style={active ? { background: 'var(--color-brand-tint)' } : {}}
        className={`flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-left transition-colors ${
          active ? '' : 'hover:bg-rose-hover'
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate text-13 ${
            isUntitled
              ? 'text-text-muted'
              : active
                ? 'font-bold text-brand-hover'
                : 'font-medium text-text-primary'
          }`}
        >
          {text}
        </span>
        <span className="shrink-0 text-12 text-text-muted transition-opacity group-hover:opacity-0">
          {chat.updatedAt}
        </span>
      </button>

      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-24 rounded-r-[10px] opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          background: `linear-gradient(to right, transparent 0%, ${hoverBg} 45%)`,
        }}
      />

      <div className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 group-hover:flex">
        <IconButton
          size="xs"
          tone="brand"
          active={!!chat.isFavorite}
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite?.()
          }}
          label={chat.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        >
          <StarIcon
            className="h-3.5 w-3.5"
            fill={chat.isFavorite ? 'currentColor' : 'none'}
            strokeWidth={1.9}
          />
        </IconButton>
        <IconButton
          size="xs"
          tone="brand"
          onClick={(e) => {
            e.stopPropagation()
            setDraft(chat.title)
            setEditing(true)
          }}
          label="이름 변경"
        >
          <EditIcon className="h-3.5 w-3.5" strokeWidth={1.9} />
        </IconButton>
        <IconButton
          size="xs"
          danger
          onClick={(e) => {
            e.stopPropagation()
            onDelete?.()
          }}
          label="대화 삭제"
        >
          <TrashIcon className="h-3.5 w-3.5" strokeWidth={1.9} />
        </IconButton>
      </div>
    </div>
  )
}
