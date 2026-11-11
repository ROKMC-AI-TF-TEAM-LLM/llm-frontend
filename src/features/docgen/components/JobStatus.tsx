import type { DocGenJob } from '../types'
import {
  JOB_STATE_LABEL,
  formatDuration,
  formatEta,
  getJobErrorMessage,
  normalizeJobStatus,
} from '../utils'
import { formatClock } from '@/shared/utils/date'
import { DomainText } from '@/features/domains/components/DomainMarks'

export function Spinner({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <span
      className={`inline-block rounded-full border-2 border-current border-t-transparent animate-spin ${className}`}
    />
  )
}

/* ───────── 상태 표시 ───────── */
const BADGE: Record<string, string> = {
  queued: 'bg-surface-subtle text-text-secondary',
  running: 'bg-brand-subtle text-brand',
  completed: 'bg-status-ok/12 text-status-ok',
  failed: 'bg-status-error/12 text-status-error',
}

/** 취소는 실패와 같은 묶음이지만 이름은 따로 보여 준다 */
const stateLabel = (job: DocGenJob) =>
  job.error?.code === 'CANCELLED'
    ? '취소'
    : JOB_STATE_LABEL[normalizeJobStatus(job.status)]

export function StatusBadge({ job }: { job: DocGenJob }) {
  const s = normalizeJobStatus(job.status)
  const cancelled = job.error?.code === 'CANCELLED'
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-12 font-semibold ${cancelled ? BADGE.queued : BADGE[s]}`}
    >
      {s === 'running' && <Spinner className="h-2.5 w-2.5" />}
      {stateLabel(job)}
    </span>
  )
}

/** 상태 점: 생성 중은 도는 표시 */
const DOT: Record<string, string> = {
  queued: 'bg-text-muted',
  running: 'bg-brand',
  completed: 'bg-status-ok',
  failed: 'bg-status-error',
}

export function StatusDot({ job }: { job: DocGenJob }) {
  const s = normalizeJobStatus(job.status)
  if (s === 'running')
    return <Spinner className="h-2.5 w-2.5 shrink-0 text-brand" />
  const color = job.error?.code === 'CANCELLED' ? 'bg-text-hint' : DOT[s]
  return (
    <span
      title={stateLabel(job)}
      className={`h-2 w-2 shrink-0 rounded-full ${color}`}
    />
  )
}

export function ProgressBar({
  value,
  className = '',
}: {
  value: number
  className?: string
}) {
  return (
    <div
      className={`h-1.5 overflow-hidden rounded-full bg-surface-subtle ${className}`}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light transition-[width] duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

/** 목록 한 줄의 진행 정보 (상태별로 바뀜) */
export function JobProgressText({ job }: { job: DocGenJob }) {
  const s = normalizeJobStatus(job.status)
  if (s === 'queued')
    return (
      <span>
        대기 중 · 앞에 {job.queue_position ?? 0}건 · 예상{' '}
        {formatEta(job.eta_seconds)}
      </span>
    )
  if (s === 'running')
    return (
      <span className="tabular-nums">
        {job.progress}% · 남은 시간 {formatEta(job.eta_seconds)}
      </span>
    )
  if (s === 'completed')
    return (
      <span>
        소요 {formatDuration(job.started_at ?? job.created_at, job.finished_at)}{' '}
        · {formatClock(job.finished_at)} 완료
      </span>
    )
  if (job.error?.code === 'CANCELLED')
    return <span>{job.progress}%에서 취소됨</span>
  return (
    <span className="text-status-error">
      {getJobErrorMessage(job.error?.code).split('.')[0]}
    </span>
  )
}

export function JobMeta({ job }: { job: DocGenJob }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-12 text-text-muted">
      <span>{job.template_name}</span>
      {job.domain && (
        <>
          <span>·</span>
          <DomainText domain={job.domain} iconSize={12} className="gap-1" />
        </>
      )}
      <span>·</span>
      <span>{job.output_format}</span>
      <span>·</span>
      <span>{formatClock(job.created_at)}</span>
    </span>
  )
}
