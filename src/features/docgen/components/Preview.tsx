import type { DocGenJob } from '../types'
import { getJobErrorMessage, normalizeJobStatus } from '../utils'
import { AlertIcon, DocumentIcon } from '@/shared/components/icons'

/* ───────── 미리보기 종이 ───────── */
const Line = ({ w, strong = false, faint = false }: { w: string; strong?: boolean; faint?: boolean }) => (
  <span className={`block rounded-sm ${strong ? 'h-3.5' : 'h-2'} ${faint ? 'bg-surface-subtle/70' : strong ? 'bg-text-hint' : 'bg-surface-subtle'}`} style={{ width: w }} />
)

export function Paper({ job, compact = false }: { job: DocGenJob; compact?: boolean }) {
  const s = normalizeJobStatus(job.status)
  const pad = compact ? 'p-6' : 'p-9'
  if (s === 'completed' && job.result) {
    return (
      <article className={`mx-auto aspect-[1/1.414] w-full max-w-[460px] overflow-hidden rounded-[4px] border border-surface-border bg-surface shadow-sm ${pad}`}>
        <h3 className="text-center text-[17px] font-bold text-text-primary">{job.title}</h3>
        <p className="mt-1 text-center text-[11px] text-text-muted">{job.template_name} · {job.output_format}</p>
        <div className="mt-6 space-y-4">
          {job.result.preview.map((sec) => (
            <section key={sec.heading}>
              <h4 className="text-[13px] font-bold text-text-primary">{sec.heading}</h4>
              <p className="mt-1 whitespace-pre-line text-[12px] leading-relaxed text-text-secondary">{sec.body}</p>
            </section>
          ))}
        </div>
      </article>
    )
  }
  const lines = s === 'running' ? Math.round((job.progress / 100) * 9) : 0
  const shape = ['60%', '100%', '92%', '40%', '100%', '86%', '100%', '72%', '50%']
  return (
    <article className={`mx-auto aspect-[1/1.414] w-full max-w-[460px] overflow-hidden rounded-[4px] border bg-surface ${s === 'queued' ? 'border-dashed border-surface-border' : 'border-surface-border shadow-sm'} ${pad}`}>
      <div className="flex flex-col gap-3">
        {shape.map((w, i) => (
          <div key={i} className={`flex items-center gap-1 ${i === 3 || i === 6 ? 'mt-3' : ''}`}>
            <Line w={w} strong={i === 0 || i === 3 || i === 6} faint={i >= lines} />
            {s === 'running' && i === lines - 1 && <span className="h-3.5 w-0.5 bg-brand animate-cursor-blink" />}
          </div>
        ))}
      </div>
      {s === 'queued' && <p className="mt-8 text-center text-[11.5px] text-text-muted">{job.template_name} 양식 윤곽</p>}
    </article>
  )
}

export function EmptyPreview({ title = '아직 미리볼 문서가 없습니다' }: { title?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-subtle text-brand">
        <DocumentIcon className="h-5 w-5" />
      </span>
      <p className="text-[14px] font-semibold text-text-primary">{title}</p>
      <p className="text-[12.5px] text-text-muted">요청을 보내거나 진행 상황에서 문서를 고르면 여기에 나타납니다.</p>
    </div>
  )
}

export function FailedNotice({ job }: { job: DocGenJob }) {
  const cancelled = job.error?.code === 'CANCELLED'
  return (
    <div role="alert" className={`mx-auto flex w-full max-w-[380px] flex-col items-center gap-2 rounded-2xl border bg-surface px-6 py-7 text-center ${cancelled ? 'border-surface-border' : 'border-status-error/30'}`}>
      <span className={`flex h-11 w-11 items-center justify-center rounded-full ${cancelled ? 'bg-surface-subtle text-text-muted' : 'bg-status-error/12 text-status-error'}`}>
        <AlertIcon className="h-5 w-5" />
      </span>
      <p className="text-[15px] font-bold text-text-primary">{cancelled ? '요청이 취소되었습니다' : '문서를 만들지 못했습니다'}</p>
      {!cancelled && <p className="text-[12.5px] leading-relaxed text-text-secondary">{getJobErrorMessage(job.error?.code)}</p>}
      {job.error?.detail && <p className="text-[11.5px] text-text-muted">{job.error.detail}</p>}
    </div>
  )
}

/** 미리보기 본문 (상태별). 진행 정보는 진행 상황 목록에서 보여 준다 */
export function PreviewBody({ job, compact = false }: { job: DocGenJob | null; compact?: boolean }) {
  if (!job) return <EmptyPreview />
  if (normalizeJobStatus(job.status) === 'failed') return <FailedNotice job={job} />
  return <Paper job={job} compact={compact} />
}
