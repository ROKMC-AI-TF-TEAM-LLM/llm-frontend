import { useLocation, useNavigate } from 'react-router-dom'
import type { ProjectView } from '@/features/projects/hooks'
import { LayersIcon } from '@/features/projects/components/icons'
import SidebarItem from './SidebarItem'

interface ProjectItemProps {
  project: ProjectView
  onToggleFavorite: (id: string) => void
  onRename: (id: string, next: string) => void
  onDelete: (id: string) => void
}

export default function ProjectItem({ project: p, onToggleFavorite, onRename, onDelete }: ProjectItemProps) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <SidebarItem
      kind="project"
      name={p.name}
      tooltip={p.name}
      icon={<LayersIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />}
      isActive={location.pathname.startsWith(`/projects/${p.id}`)}
      isFavorite={p.isFavorite}
      maxLength={255}
      labels={{ rename: '이름 변경', remove: '프로젝트 삭제' }}
      onOpen={() => navigate(`/projects/${p.id}`)}
      onRename={(next) => onRename(p.id, next)}
      onToggleFavorite={() => onToggleFavorite(p.id)}
      onDelete={() => onDelete(p.id)}
    />
  )
}
