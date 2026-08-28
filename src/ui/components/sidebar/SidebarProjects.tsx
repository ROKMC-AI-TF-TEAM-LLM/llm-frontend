import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useProjectStore } from '../../../features/projects/projectStore'
import { useInfiniteProjects, useCreateProject, useUpdateProject, useToggleProjectFavorite } from '../../../hooks/useProject'
import ProjectItem from './ProjectItem'
import { CreateProjectModal } from '../../../features/projects/ui'

export default function SidebarProjects({ isOpen }: { isOpen: boolean }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [expanded, setExpanded] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const projects = useProjectStore((s) => s.projects)
  const setFromServer = useProjectStore((s) => s.setFromServer)
  const addCreated = useProjectStore((s) => s.addCreated)
  const remove = useProjectStore((s) => s.remove)

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteProjects()
  const { mutateAsync: createProjectApi } = useCreateProject()
  const { mutate: updateProject } = useUpdateProject()
  const { mutate: toggleFavoriteApi } = useToggleProjectFavorite()
  const rename = (id: string, next: string) => updateProject({ projectId: id, title: next })
  const toggleFavorite = (id: string) => {
    const cur = projects.find((p) => p.id === id)?.isFavorite ?? false
    toggleFavoriteApi({ projectId: id, next: !cur })
  }

  useEffect(() => {
    if (!data) return
    const serverItems = data.pages.flatMap((p) => p.data.data.items)
    setFromServer(serverItems)
  }, [data, setFromServer])

  const sentinelRef = useRef<HTMLLIElement>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage()
    }, { threshold: 0.1 })
    io.observe(el)
    return () => io.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const items = projects.filter((p) => !p.isFavorite)

  const handleDelete = (id: string) => {
    remove(id)
    if (location.pathname.startsWith(`/projects/${id}`)) navigate('/chat')
  }

  return (
    <div
      className={`px-[12px] pt-[12px] pb-[4px] overflow-hidden transition-opacity duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="mb-1 flex w-full items-center gap-1 rounded-[7px] px-[8px] py-[3px] text-left transition-colors hover:bg-[#fdedf2]"
      >
        <span className="text-[10.5px] mars-brand-serif font-extrabold uppercase tracking-[0.12em] text-[#c9aab2] whitespace-nowrap">
          프로젝트
        </span>
        <svg
          className={`h-3 w-3 shrink-0 text-[#c9aab2] transition-transform duration-200 ${
            expanded ? '' : '-rotate-90'
          }`}
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
          <li>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex w-full items-center gap-2.5 rounded-[9px] px-[8px] py-[7px] text-left text-[13px] font-normal text-[#b3aab0] transition-colors hover:bg-[#fdedf2] hover:text-[#c0002a]"
            >
              <svg
                className="h-3.5 w-3.5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="truncate  mars-brand-serif">새 프로젝트</span>
            </button>
          </li>

          {items.map((p) => (
            <ProjectItem
              key={p.id}
              project={p}
              onToggleFavorite={toggleFavorite}
              onRename={rename}
              onDelete={handleDelete}
            />
          ))}
          {hasNextPage && <li ref={sentinelRef} className="h-1" />}
        </ul>
      )}

      <CreateProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (name, instructions) => {
          const res = await createProjectApi({ title: name, instructions })
          const newId = addCreated(res.data.data)
          navigate(`/projects/${newId}`)
        }}
      />
    </div>
  )
}
