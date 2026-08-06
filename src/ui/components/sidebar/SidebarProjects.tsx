import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useProjectStore } from '../../../features/projects/projectStore'
import { useInfiniteProjects, useCreateProject } from '../../../hooks/useProject'
import ProjectItem from './ProjectItem'
import { CreateProjectModal } from '../../../features/projects/ui'

// 사이드바 '프로젝트' 섹션.
// Grok처럼 섹션 제목을 눌러 접었다 펼 수 있고, 맨 위에 '+ 새 프로젝트' 줄이 있다.
// 프로젝트 목록 화면은 없다 — 이 섹션이 목록 역할을 하고, 클릭하면 바로 프로젝트로 간다.
// 즐겨찾기된 프로젝트는 위쪽 '즐겨찾기' 칸에 올라가므로 여기서는 제외한다.
export default function SidebarProjects({ isOpen }: { isOpen: boolean }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [expanded, setExpanded] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const projects = useProjectStore((s) => s.projects)
  const setFromServer = useProjectStore((s) => s.setFromServer)
  const addCreated = useProjectStore((s) => s.addCreated)
  const toggleFavorite = useProjectStore((s) => s.toggleFavorite)
  const rename = useProjectStore((s) => s.rename)
  const remove = useProjectStore((s) => s.remove)

  // 서버 프로젝트 목록(커서 무한스크롤) → 스토어에 반영. 사이드바가 목록 조회의 주체다.
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteProjects()
  const { mutateAsync: createProjectApi } = useCreateProject()

  useEffect(() => {
    if (!data) return
    const serverItems = data.pages.flatMap((p) => p.data.data.items)
    setFromServer(serverItems)
  }, [data, setFromServer])

  // 목록 맨 아래 도달 시 다음 페이지 로드
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
    // 지금 보고 있던 프로젝트가 사라졌으면 새 채팅으로 물러난다.
    // (삭제 API는 아직 없음 — 로컬 목록에서만 제거된다)
    if (location.pathname.startsWith(`/projects/${id}`)) navigate('/chat')
  }

  return (
    <div
      className={`px-[12px] pt-[12px] pb-[4px] overflow-hidden transition-opacity duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* 섹션 제목 — 눌러서 접기/펴기 */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="mb-1 flex w-full items-center gap-1 rounded-[7px] px-[8px] py-[3px] text-left transition-colors hover:bg-[#fdedf2]"
      >
        <span className="text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-[#c9aab2] whitespace-nowrap">
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
          {/* 새 프로젝트 — 프로젝트 목록보다 연하게(부차적 동작이라 이름들과 경쟁하지 않게) */}
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
              <span className="truncate">새 프로젝트</span>
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
          {/* 무한 스크롤 감지 지점 */}
          {hasNextPage && <li ref={sentinelRef} className="h-1" />}
        </ul>
      )}

      {/* 새 프로젝트 : 이름·지침을 받아 서버에 만든 뒤 곧바로 그 프로젝트로 이동한다 */}
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
