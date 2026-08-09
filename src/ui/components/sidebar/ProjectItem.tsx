import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Project } from '../../../features/projects/mock'
import { EditIcon, LayersIcon, StarIcon, TrashIcon } from '../../../features/projects/icons'

const HOVER_BG = '#fdedf2'

interface ProjectItemProps {
  project: Project
  onToggleFavorite: (id: string) => void
  onRename: (id: string, next: string) => void
  onDelete: (id: string) => void
}

export default function ProjectItem({
  project: p,
  onToggleFavorite,
  onRename,
  onDelete,
}: ProjectItemProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(p.name)

  const isActive = location.pathname.startsWith(`/projects/${p.id}`)

  const submit = () => {
    const next = draft.trim()
    if (next && next !== p.name) onRename(p.id, next)
    setEditing(false)
  }

  if (editing) {
    return (
      <li>
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
          className="w-full rounded-lg border border-surface-border bg-surface px-[8px] py-[7px] text-sm text-text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </li>
    )
  }

  return (
    <li className="group relative">
      <button
        onClick={() => navigate(`/projects/${p.id}`)}
        title={p.name}
        style={isActive ? { background: HOVER_BG, color: '#c0002a' } : {}}
        className={`flex w-full items-center gap-2.5 rounded-[9px] px-[8px] py-[7px] text-left text-[13px] transition-colors ${
          isActive ? 'font-bold' : 'font-medium text-[#5a5560] hover:bg-[#fdedf2] hover:text-[#c0002a]'
        }`}
      >
        <LayersIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
        <span className="truncate overflow-hidden">{p.name}</span>
      </button>

      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-28 rounded-r-[9px] opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        style={{ background: `linear-gradient(to right, rgba(253,237,242,0) 0%, ${HOVER_BG} 35%)` }}
      />

      <div className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 group-hover:flex">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite(p.id)
          }}
          aria-label={p.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          className={`rounded-lg p-1.5 transition-colors hover:bg-brand-subtle ${
            p.isFavorite ? 'text-brand' : 'text-text-muted hover:text-brand'
          }`}
        >
          <StarIcon className="h-3 w-3" filled={p.isFavorite} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            setDraft(p.name)
            setEditing(true)
          }}
          aria-label="이름 변경"
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-brand-subtle hover:text-brand"
        >
          <EditIcon className="h-3 w-3" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(p.id)
          }}
          aria-label="프로젝트 삭제"
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <TrashIcon className="h-3 w-3" />
        </button>
      </div>
    </li>
  )
}
