import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { ChatItem } from '../../../types'
import SessionItem from './SessionItem'
import Toast from '../Toast'
import ProjectItem from './ProjectItem'
import { useProjectStore } from '../../../features/projects/projectStore'
import { useUpdateProject, useToggleProjectFavorite } from '../../../hooks/useProject'

interface FavoriteChatsProps {
  isOpen: boolean
  favorites: ChatItem[]
}

export default function FavoriteChats({ isOpen, favorites }: FavoriteChatsProps) {
  const [sidebarError, setSidebarError] = useState('')
  const [expanded, setExpanded] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  const projects = useProjectStore((s) => s.projects)
  const remove = useProjectStore((s) => s.remove)
  const { mutate: updateProject } = useUpdateProject()
  const { mutate: toggleFavoriteApi } = useToggleProjectFavorite()
  const rename = (id: string, next: string) => updateProject({ projectId: id, title: next })
  const toggleFavorite = (id: string) => {
    const cur = projects.find((p) => p.id === id)?.isFavorite ?? false
    toggleFavoriteApi({ projectId: id, next: !cur })
  }

  const favProjects = projects.filter((p) => p.isFavorite)

  const handleDelete = (id: string) => {
    remove(id)
    if (location.pathname.startsWith(`/projects/${id}`)) navigate('/chat')
  }

  if (favorites.length === 0 && favProjects.length === 0) return null

  return (
    <div
      className={`px-[12px] pt-[12px] overflow-hidden transition-opacity duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {sidebarError && <Toast message={sidebarError} onClose={() => setSidebarError('')} />}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="mb-1 flex w-full items-center gap-1 rounded-[7px] px-[8px] py-[3px] text-left transition-colors hover:bg-[#fdedf2]"
      >
        <span className="text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-[#c9aab2] whitespace-nowrap">
          즐겨찾기
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
            <SessionItem key={chat.id} chat={chat} onError={setSidebarError} />
          ))}
        </ul>
      )}
    </div>
  )
}
