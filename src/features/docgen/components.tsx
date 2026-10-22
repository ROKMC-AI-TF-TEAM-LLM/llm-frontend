// 문서 생성 화면 조각. 시안이 정해지면 고른 시안이 이 조각들을 그대로 가져다 쓴다.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { DocGenJob, DocGenOutputFormat } from '../../types/docgen'
import {
  JOB_STATE_LABEL,
  OUTPUT_FORMATS,
  formatClock,
  formatDuration,
  formatEta,
  getJobErrorMessage,
  normalizeJobStatus,
} from '../../utils/docgen'
import { getDomainLabel, getDomainStyle } from '../../utils/document'
import { useCancelDocGenJob, useDeleteDocGenJob, useRetryDocGenJob } from '../../hooks/useDocGen'
import { showToast } from '../../api/store/toastStore'
import DomainIcon from '../../ui/components/chat/DomainIcon'
import { AlertIcon, CheckIcon, ChevronIcon, DocIcon, DownloadIcon, RetryIcon, StopIcon } from './icons'
import type { Composer } from './hooks'

export function Spinner({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return <span className={`inline-block rounded-full border-2 border-current border-t-transparent animate-spin ${className}`} />
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
  job.error?.code === 'CANCELLED' ? '취소' : JOB_STATE_LABEL[normalizeJobStatus(job.status)]

export function StatusBadge({ job }: { job: DocGenJob }) {
  const s = normalizeJobStatus(job.status)
  const cancelled = job.error?.code === 'CANCELLED'
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${cancelled ? BADGE.queued : BADGE[s]}`}>
      {s === 'running' && <Spinner className="h-2.5 w-2.5" />}
      {stateLabel(job)}
    </span>
  )
}

/** v3식 상태 점: 생성 중은 도는 표시 */
const DOT: Record<string, string> = {
  queued: 'bg-text-muted',
  running: 'bg-brand',
  completed: 'bg-status-ok',
  failed: 'bg-status-error',
}

export function StatusDot({ job }: { job: DocGenJob }) {
  const s = normalizeJobStatus(job.status)
  if (s === 'running') return <Spinner className="h-2.5 w-2.5 shrink-0 text-brand" />
  const color = job.error?.code === 'CANCELLED' ? 'bg-text-hint' : DOT[s]
  return <span title={stateLabel(job)} className={`h-2 w-2 shrink-0 rounded-full ${color}`} />
}

export function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-surface-subtle ${className}`}>
      <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light transition-[width] duration-500" style={{ width: `${value}%` }} />
    </div>
  )
}

/** 목록 한 줄의 진행 정보 (상태별로 바뀜) */
export function JobProgressText({ job }: { job: DocGenJob }) {
  const s = normalizeJobStatus(job.status)
  if (s === 'queued')
    return <span>대기 중 · 앞에 {job.queue_position ?? 0}건 · 예상 {formatEta(job.eta_seconds)}</span>
  if (s === 'running') return <span className="tabular-nums">{job.progress}% · 남은 시간 {formatEta(job.eta_seconds)}</span>
  if (s === 'completed')
    return <span>소요 {formatDuration(job.started_at ?? job.created_at, job.finished_at)} · {formatClock(job.finished_at)} 완료</span>
  if (job.error?.code === 'CANCELLED') return <span>{job.progress}%에서 취소됨</span>
  return <span className="text-status-error">{getJobErrorMessage(job.error?.code).split('.')[0]}</span>
}

export function JobMeta({ job }: { job: DocGenJob }) {
  const style = getDomainStyle(job.domain)
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-text-muted">
      <span>{job.template_name}</span>
      {job.domain && (
        <>
          <span>·</span>
          <span className="inline-flex items-center gap-1" style={{ color: style.badgeText }}>
            <DomainIcon code={job.domain} size={12} />
            {getDomainLabel(job.domain)}
          </span>
        </>
      )}
      <span>·</span>
      <span>{job.output_format}</span>
      <span>·</span>
      <span>{formatClock(job.created_at)}</span>
    </span>
  )
}

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
        <DocIcon className="h-5 w-5" />
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

/* ───────── 작업 액션 (진행 상황 목록에서, 상태별로 바뀜) ───────── */
const ghostBtn = 'inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-lg border px-2.5 text-[12.5px] font-semibold transition-colors disabled:opacity-50'

// TODO(백엔드 연결): 결과 파일 다운로드 엔드포인트가 정해지면 연결한다
export function DownloadButton({ job, primary = false }: { job: DocGenJob; primary?: boolean }) {
  return (
    <button type="button" aria-label={`${job.result?.file_name ?? job.title} 다운로드`}
      className={`${ghostBtn} ${primary ? 'border-brand bg-brand text-white hover:bg-brand-hover' : 'border-brand-soft text-brand hover:bg-brand-subtle'}`}>
      <DownloadIcon className="h-3.5 w-3.5" /> 다운로드
    </button>
  )
}

export function JobActions({ job }: { job: DocGenJob }) {
  const cancel = useCancelDocGenJob()
  const retry = useRetryDocGenJob()
  const remove = useDeleteDocGenJob()
  const busy = cancel.isPending || retry.isPending || remove.isPending
  const onError = { onError: () => showToast('요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.') }
  const s = normalizeJobStatus(job.status)
  if (s === 'queued' || s === 'running')
    return (
      <button type="button" disabled={busy} onClick={() => cancel.mutate(job.job_id, onError)} className={`${ghostBtn} border-surface-border text-text-secondary hover:bg-surface-subtle`}>
        {s === 'running' && <StopIcon className="h-3 w-3" />} {s === 'queued' ? '취소' : '중지'}
      </button>
    )
  if (s === 'completed') return <DownloadButton job={job} />
  return (
    <span className="inline-flex gap-1">
      <button type="button" disabled={busy} onClick={() => retry.mutate(job.job_id, onError)} className={`${ghostBtn} border-brand-soft text-brand hover:bg-brand-subtle`}>
        <RetryIcon className="h-3.5 w-3.5" /> 재시도
      </button>
      <button type="button" disabled={busy} onClick={() => remove.mutate(job.job_id, onError)} className={`${ghostBtn} border-surface-border text-text-secondary hover:border-status-error/40 hover:text-status-error`}>삭제</button>
    </span>
  )
}

/** 미리보기 머리 액션: 다운로드만 둔다 */
export function PreviewActions({ job }: { job: DocGenJob | null }) {
  if (!job || normalizeJobStatus(job.status) !== 'completed') return null
  return <DownloadButton job={job} primary />
}

/** 미리보기 본문 (상태별). 진행 정보는 진행 상황 목록에서 보여 준다 */
export function PreviewBody({ job, compact = false }: { job: DocGenJob | null; compact?: boolean }) {
  if (!job) return <EmptyPreview />
  if (normalizeJobStatus(job.status) === 'failed') return <FailedNotice job={job} />
  return <Paper job={job} compact={compact} />
}

/* ───────── 입력창 선택 칩 ───────── */
interface PickerOption { value: string; label: string; hint?: string }

export function Picker({ label, value, options, onChange, disabled = false, icon }: {
  label: string; value: string | null; options: PickerOption[]; onChange: (v: string) => void; disabled?: boolean; icon?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])
  const current = options.find((o) => o.value === value)
  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={disabled} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors hover:bg-brand-subtle hover:text-brand disabled:pointer-events-none disabled:opacity-60 ${open ? 'bg-brand-subtle text-brand' : current ? 'text-text-primary' : 'text-text-secondary'}`}>
        {icon}
        {current?.label ?? label}
        <ChevronIcon className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul role="menu" aria-label={label}
          className="absolute left-0 top-full z-20 mt-2 max-h-[320px] w-[260px] overflow-y-auto rounded-2xl border border-surface-border bg-surface p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.1)] max-sm:fixed max-sm:inset-x-4 max-sm:bottom-4 max-sm:top-auto max-sm:w-auto">
          <li role="none" className="px-3 pb-1 pt-1.5 text-[11.5px] font-semibold text-text-muted">{label}</li>
          {options.map((o) => {
            const on = o.value === value
            return (
              <li key={o.value} role="none">
                <button type="button" role="menuitemradio" aria-checked={on} onClick={() => { onChange(o.value); setOpen(false) }}
                  className={`flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left transition-colors ${on ? 'bg-brand-subtle' : 'hover:bg-surface-card1'}`}>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[13.5px] font-semibold ${on ? 'text-brand' : 'text-text-primary'}`}>{o.label}</span>
                    {o.hint && <span className="mt-0.5 block text-[12px] leading-snug text-text-muted">{o.hint}</span>}
                  </span>
                  {on && <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/** 분야·파일 유형(·양식) 선택 칩 묶음 */
export function ComposerOptions({ c, disabled = false, withTemplate = false }: { c: Composer; disabled?: boolean; withTemplate?: boolean }) {
  return (
    <>
      <Picker label="분야" value={c.domain} disabled={disabled} onChange={c.setDomain}
        icon={c.domain ? <DomainIcon code={c.domain} size={14} /> : undefined}
        options={[{ value: '', label: '전체 분야' }, ...c.domains.map((d) => ({ value: d.code, label: d.label }))]} />
      <Picker label="파일 유형" value={c.format} disabled={disabled} onChange={(v) => c.setFormat(v as DocGenOutputFormat)}
        options={OUTPUT_FORMATS.map((f) => ({ value: f.code, label: f.label }))} />
      {withTemplate && (
        <Picker label="양식" value={c.templateId} disabled={disabled} icon={<DocIcon className="h-3.5 w-3.5" />} onChange={c.pickTemplate}
          options={c.templates.map((t) => ({ value: t.template_id, label: t.name, hint: t.description }))} />
      )}
    </>
  )
}
