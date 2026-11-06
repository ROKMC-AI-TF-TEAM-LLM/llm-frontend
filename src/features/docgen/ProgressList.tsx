import type { DocGenJob } from '../../types/docgen'
import { normalizeJobStatus } from '../../utils/docgen'
import { getDomainStyle } from '../../utils/document'
import { selectable } from './hooks'
import { JobActions, JobMeta, ProgressBar, StatusBadge } from './components'

/** 진행 문구. 예상·남은 시간은 보여 주지 않는다 */
const progressText = (job: DocGenJob) =>
  normalizeJobStatus(job.status) === 'queued' ? `대기 중 · 앞에 ${job.queue_position ?? 0}건` : `${job.progress}%`

/** 진행 상황: 대기·생성 중인 작업 줄. 줄을 누르면 미리보기에 띄운다 */
export default function ProgressList({ jobs, selectedId, onSelect, isFresh }: {
  jobs: DocGenJob[]
  selectedId: string | null
  onSelect: (id: string) => void
  isFresh: (id: string) => boolean
}) {
  return (
    <section aria-label="진행 상황" className="rounded-[20px] border border-surface-border">
      <div className="flex items-center gap-2 border-b border-surface-border px-5 py-3">
        <h2 className="text-[15px] font-bold text-text-primary">진행 상황</h2>
        <span className="text-[12.5px] text-text-muted">{jobs.length}건</span>
      </div>
      <ul>
        {jobs.map((job) => {
          const on = job.job_id === selectedId
          return (
            <li key={job.job_id} aria-pressed={on} {...selectable(() => onSelect(job.job_id))}
              className={`flex cursor-pointer items-center gap-3 border-b border-surface-border px-5 py-3 last:border-b-0 ${on ? 'bg-brand-subtle/50' : 'hover:bg-surface-card1'} ${isFresh(job.job_id) ? 'animate-docgen-row-in' : ''}`}>
              <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: getDomainStyle(job.domain).bar }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-text-primary">{job.title}</p>
                <JobMeta job={job} />
                {normalizeJobStatus(job.status) === 'running' && <ProgressBar value={job.progress} className="mt-1.5 max-w-[240px]" />}
              </div>
              <span className="hidden w-[190px] shrink-0 text-[12px] tabular-nums text-text-secondary sm:block">{progressText(job)}</span>
              <StatusBadge job={job} />
              <span onClick={(e) => e.stopPropagation()}><JobActions job={job} /></span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
