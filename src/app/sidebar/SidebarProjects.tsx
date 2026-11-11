import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectList, useCreateProject, useUpdateProject, useToggleProjectFavorite, useConfirmDeleteProject } from '@/features/projects/hooks'
import ProjectItem from './ProjectItem'
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll'
import { CreateProjectModal } from '@/features/projects/components/parts'

export default function SidebarProjects({ isOpen }: { isOpen: boolean }) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)

  const { projects, hasNextPage, fetchNextPage, isFetchingNextPage } = useProjectList()
  const { mutateAsync: createProjectApi } = useCreateProject()
  const { mutate: updateProject } = useUpdateProject()
  const { mutate: toggleFavoriteApi } = useToggleProjectFavorite()
  const confirmDelete = useConfirmDeleteProject()
  const rename = (id: string, next: string) => updateProject({ projectId: id, title: next })
  const toggleFavorite = (id: string) => {
    const cur = projects.find((p) => p.id === id)?.isFavorite ?? false
    toggleFavoriteApi({ projectId: id, next: !cur })
  }

  const sentinelRef = useInfiniteScroll<HTMLLIElement>({
    hasMore: !!hasNextPage,
    isLoading: isFetchingNextPage,
    onLoadMore: fetchNextPage,
    threshold: 0.1,
  })

  const items = projects.filter((p) => !p.isFavorite)

  const handleDelete = (id: string) => {
    const target = projects.find((p) => p.id === id)
    if (target) confirmDelete({ id, name: target.name })
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
          const newId = res.data.data.project_id
          navigate(`/projects/${newId}`)
        }}
      />
    </div>
  )
}
