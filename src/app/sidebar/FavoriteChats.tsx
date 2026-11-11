import { useState } from 'react'
import type { ChatItem } from '@/features/chat/types'
import SessionItem from './SessionItem'
import ProjectItem from './ProjectItem'
import {
  useProjectList,
  useUpdateProject,
  useToggleProjectFavorite,
  useConfirmDeleteProject,
} from '@/features/projects/hooks'
import { ChevronDownIcon } from '@/shared/components/icons'

interface FavoriteChatsProps {
  isOpen: boolean
  favorites: ChatItem[]
}

export default function FavoriteChats({
  isOpen,
  favorites,
}: FavoriteChatsProps) {
  const [expanded, setExpanded] = useState(true)

  const { projects } = useProjectList()
  const { mutate: updateProject } = useUpdateProject()
  const { mutate: toggleFavoriteApi } = useToggleProjectFavorite()
  const confirmDelete = useConfirmDeleteProject()
  const rename = (id: string, next: string) =>
    updateProject({ projectId: id, title: next })
  const toggleFavorite = (id: string) => {
    const cur = projects.find((p) => p.id === id)?.isFavorite ?? false
    toggleFavoriteApi({ projectId: id, next: !cur })
  }

  const favProjects = projects.filter((p) => p.isFavorite)

  const handleDelete = (id: string) => {
    const target = projects.find((p) => p.id === id)
    if (target) confirmDelete({ id, name: target.name })
  }

  if (favorites.length === 0 && favProjects.length === 0) return null

  return (
    <div
      className={`px-[12px] pt-[12px] overflow-hidden transition-opacity duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="mb-1 flex w-full items-center gap-1 rounded-[8px] px-[8px] py-[3px] text-left transition-colors hover:bg-brand-tint"
      >
        <span className="text-11 font-extrabold mars-brand-serif uppercase tracking-[0.12em] text-rose-muted whitespace-nowrap">
          즐겨찾기
        </span>
        <ChevronDownIcon
          className={`h-3 w-3 shrink-0 text-rose-muted transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`}
          strokeWidth={2.6}
        />
      </button>

      {expanded && (
        <ul className="space-y-0">
          {favProjects.map((p) => (
            <ProjectItem
              key={p.id}
              project={p}
              onToggleFavorite={toggleFavorite}
              onRename={rename}
              onDelete={handleDelete}
            />
          ))}

          {favorites.map((chat) => (
            <SessionItem key={chat.id} chat={chat} />
          ))}
        </ul>
      )}
    </div>
  )
}
