import type { DocGenJob } from '../../types/docgen'
import { normalizeJobStatus } from '../../utils/docgen'
import { selectable } from './hooks'
import { JobActions, JobProgressText, StatusDot } from './components'

/** 생성 문서: 끝난(완료·실패·취소) 작업 줄. 줄을 누르면 미리보기에 띄운다 */
export default function DocumentList({ jobs, selectedId, onSelect, isFresh }: {
  jobs: DocGenJob[]
  selectedId: string | null
  onSelect: (id: string) => void
  isFresh: (id: string) => boolean
}) {
  return (
    <section aria-label="생성 문서">
      <h2 className="mb-2 px-1 text-[13px] font-semibold text-text-muted">생성 문서 {jobs.length}</h2>
      <ul className="flex flex-col gap-0.5">
        {jobs.map((job) => {
          const on = job.job_id === selectedId
          const fresh = isFresh(job.job_id)
          return (
            <li key={job.job_id} className={fresh ? 'animate-docgen-row-in rounded-xl' : ''}>
              <div aria-pressed={on} {...selectable(() => onSelect(job.job_id))}
                className={`group cursor-pointer rounded-xl px-3 py-2.5 transition-colors ${on ? 'bg-brand-subtle' : 'hover:bg-surface-card1'}`}>
                <div className="flex items-center gap-2">
                  <StatusDot job={job} />
                  <span className={`min-w-0 flex-1 truncate text-[13.5px] font-semibold ${on ? 'text-brand' : 'text-text-primary'}`}>{job.title}</span>
                  {fresh && <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[10.5px] font-bold text-white">방금</span>}
                  <span className="shrink-0 text-[11.5px] text-text-muted">{job.template_name} · {job.output_format}</span>
                </div>
                <div className="mt-1 flex min-h-8 items-center justify-between gap-2 pl-4 text-[11.5px] text-text-muted">
                  {/* 완료된 문서는 소요·완료 시각을 보여 주지 않는다 (실패·취소 사유만) */}
                  {normalizeJobStatus(job.status) === 'completed' ? <span /> : <JobProgressText job={job} />}
                  <span onClick={(e) => e.stopPropagation()} className={on ? '' : 'lg:opacity-0 lg:group-hover:opacity-100'}><JobActions job={job} /></span>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
