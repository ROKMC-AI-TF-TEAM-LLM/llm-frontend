import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { ChatItem } from '../../../types'
import SessionItem from './SessionItem'
import Toast from '../Toast'
import ProjectItem from './ProjectItem'
import { useProjectStore } from '../../../features/projects/projectStore'

interface FavoriteChatsProps {
  isOpen: boolean
  /** 즐겨찾기된 세션들. 별도 상태가 아니라 세션 목록에서 파생된 값이다. */
  favorites: ChatItem[]
}

// 사이드바 '즐겨찾기' 섹션.
// 프로젝트와 대화가 한 칸에 섞이고, 프로젝트만 왼쪽에 레이어 아이콘을 달아 구분한다.
// 프로젝트를 먼저 쌓고 그 아래에 대화를 둔다.
//
// TODO(API): 프로젝트 즐겨찾기 연결 지점. 서버에서 내려오면 MOCK_PROJECTS를 훅으로 교체한다.
export default function FavoriteChats({ isOpen, favorites }: FavoriteChatsProps) {
  const [sidebarError, setSidebarError] = useState('')
  const [expanded, setExpanded] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  const projects = useProjectStore((s) => s.projects)
  const toggleFavorite = useProjectStore((s) => s.toggleFavorite)
  const rename = useProjectStore((s) => s.rename)
  const remove = useProjectStore((s) => s.remove)

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

      {/* 섹션 제목 — 눌러서 접기/펴기 */}
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
          {/* 즐겨찾기된 프로젝트 — 레이어 아이콘으로 대화와 구분 */}
          {favProjects.map((p) => (
            <ProjectItem
              key={p.id}
              project={p}
              onToggleFavorite={toggleFavorite}
              onRename={rename}
              onDelete={handleDelete}
            />
          ))}

          {/* 즐겨찾기된 대화 — 아이콘이 없으므로 제목을 왼쪽에 그대로 붙인다 */}
          {favorites.map((chat) => (
            <SessionItem key={chat.id} chat={chat} onError={setSidebarError} />
          ))}
        </ul>
      )}
    </div>
  )
}
