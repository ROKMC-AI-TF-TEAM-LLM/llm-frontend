// TEMP(시안 비교용): 6단계에서 drafts 폴더째 삭제
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { DocGenJob } from '../../../types/docgen'
import {
  JOB_STATE_LABEL,
  STAGES,
  formatBytes,
  formatClock,
  formatDuration,
  formatEta,
  getJobErrorMessage,
  getStageIndex,
  normalizeJobStatus,
} from '../../../utils/docgen'
import { getDomainLabel, getDomainStyle } from '../../../utils/document'
import DomainIcon from '../../../ui/components/chat/DomainIcon'
import { DRAFTS, PAGE_STATES } from './draftState'

/** 시안 전환 + 상태 전환 막대 */
export function DraftBar({ current }: { current: string }) {
  const [params, setParams] = useSearchParams()
  const state = params.get('state') ?? 'idle'
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-dashed border-brand-soft bg-brand-subtle/60 px-5 py-2 text-[12.5px]">
      <span className="font-semibold text-brand">시안 비교</span>
      <div className="flex flex-wrap gap-1">
        {DRAFTS.map((d) => (
          <Link
            key={d.v}
            to={`/docgen/${d.v}?state=${state}`}
            className={`rounded-full px-2.5 py-1 font-semibold transition-colors ${
              d.v === current ? 'bg-brand text-white' : 'text-text-secondary hover:bg-brand-soft'
            }`}
          >
            {d.v} {d.name}
          </Link>
        ))}
      </div>
      <span className="h-4 w-px bg-brand-soft" />
      <div className="flex flex-wrap gap-1">
        {PAGE_STATES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setParams({ state: s.value })}
            className={`rounded-full px-2.5 py-1 font-semibold transition-colors ${
              s.value === state ? 'bg-text-primary text-white' : 'text-text-secondary hover:bg-surface-subtle'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ───────── 아이콘 (인라인 stroke SVG) ───────── */
type IconProps = { className?: string }
function Svg({ className = 'h-4 w-4', children }: IconProps & { children: ReactNode }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}
export function ClipIcon(p: IconProps) { return <Svg {...p}><path d="m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" /></Svg> }
export function DocIcon(p: IconProps) { return <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></Svg> }
export function CheckIcon(p: IconProps) { return <Svg {...p}><path d="M20 6 9 17l-5-5" /></Svg> }
export function XIcon(p: IconProps) { return <Svg {...p}><path d="M18 6 6 18M6 6l12 12" /></Svg> }
export function RetryIcon(p: IconProps) { return <Svg {...p}><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" /><path d="M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16" /><path d="M3 21v-5h5" /></Svg> }
export function DownloadIcon(p: IconProps) { return <Svg {...p}><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></Svg> }
export function ChevronIcon(p: IconProps) { return <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg> }
export function StopIcon(p: IconProps) { return <Svg {...p}><rect x="6" y="6" width="12" height="12" rx="2" /></Svg> }
export function ArrowUpIcon(p: IconProps) { return <Svg {...p}><path d="M12 19V5M5 12l7-7 7 7" /></Svg> }
export function AlertIcon(p: IconProps) { return <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></Svg> }
export function CopyIcon(p: IconProps) { return <Svg {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></Svg> }
export function MoreIcon(p: IconProps) { return <Svg {...p}><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></Svg> }

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

export function StatusBadge({ job }: { job: DocGenJob }) {
  const s = normalizeJobStatus(job.status)
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${BADGE[s]}`}>
      {s === 'running' && <Spinner className="h-2.5 w-2.5" />}
      {JOB_STATE_LABEL[s]}
    </span>
  )
}

export function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-surface-subtle ${className}`}>
      <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light transition-[width] duration-500" style={{ width: `${value}%` }} />
    </div>
  )
}

/** 큐 한 줄의 진행 정보 (상태별로 바뀜) */
export function JobProgressText({ job }: { job: DocGenJob }) {
  const s = normalizeJobStatus(job.status)
  if (s === 'queued')
    return <span>앞에 {job.queue_position ?? 0}건 · {formatEta(job.eta_seconds)}</span>
  if (s === 'running') {
    const idx = getStageIndex(job.stage)
    return <span>{idx}/3 {STAGES[idx - 1].label} · {job.progress}%</span>
  }
  if (s === 'completed') return <span>소요 {formatDuration(job.started_at ?? job.created_at, job.finished_at)}</span>
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
      <span>첨부 {job.attachments.length}개</span>
      <span>·</span>
      <span>{formatClock(job.created_at)}</span>
    </span>
  )
}

export function StageSteps({ job }: { job: DocGenJob }) {
  const s = normalizeJobStatus(job.status)
  const current = s === 'queued' ? 0 : s === 'completed' ? 4 : getStageIndex(job.stage)
  return (
    <ol className="grid grid-cols-3 gap-2">
      {STAGES.map((st, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current && s === 'running'
        const broken = n === current && s === 'failed'
        return (
          <li key={st.code} className="flex flex-col gap-1.5">
            <span className={`h-1 rounded-full ${done ? 'bg-brand' : active ? 'bg-brand-light animate-pulse' : broken ? 'bg-status-error' : 'bg-surface-subtle'}`} />
            <span className={`flex items-center gap-1 text-[11.5px] ${active ? 'font-semibold text-brand' : broken ? 'font-semibold text-status-error' : done ? 'text-text-secondary' : 'text-text-muted'}`}>
              {done && <CheckIcon className="h-3 w-3" />}
              {active && <Spinner className="h-2.5 w-2.5" />}
              {broken && <AlertIcon className="h-3 w-3" />}
              {st.label}
            </span>
          </li>
        )
      })}
    </ol>
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
              <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">{sec.body}</p>
            </section>
          ))}
          <div className="grid grid-cols-3 overflow-hidden rounded-[3px] border border-surface-border text-[10.5px] text-text-secondary">
            {['항목', '결과', '조치', '망분리', '적합', '-', '보조기억매체', '부적합', '10월 말'].map((c, i) => (
              <span key={i} className={`border-surface-border px-2 py-1 ${i < 3 ? 'bg-surface-subtle font-semibold' : 'border-t'}`}>{c}</span>
            ))}
          </div>
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
      <p className="text-[12.5px] text-text-muted">양식을 고르고 생성하면 결과가 여기에 나타납니다.</p>
    </div>
  )
}

export function FailedNotice({ job }: { job: DocGenJob }) {
  return (
    <div role="alert" className="mx-auto flex w-full max-w-[380px] flex-col items-center gap-2 rounded-2xl border border-status-error/30 bg-surface px-6 py-7 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-status-error/12 text-status-error">
        <AlertIcon className="h-5 w-5" />
      </span>
      <p className="text-[15px] font-bold text-text-primary">문서를 만들지 못했습니다</p>
      <p className="text-[12.5px] leading-relaxed text-text-secondary">{getJobErrorMessage(job.error?.code)}</p>
      {job.error?.detail && <p className="text-[11.5px] text-text-muted">{job.error.detail}</p>}
      <div className="mt-2 flex gap-2">
        <button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-hover">
          <RetryIcon className="h-3.5 w-3.5" /> 다시 시도
        </button>
        <button type="button" className="rounded-full border border-surface-border px-4 py-2 text-[13px] font-semibold text-text-secondary hover:bg-surface-subtle">
          프롬프트 수정
        </button>
      </div>
    </div>
  )
}

/* ───────── 작업 액션 (상태별로 바뀜) ───────── */
const ghostBtn = 'inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-lg border px-2.5 text-[12.5px] font-semibold transition-colors'

export function JobActions({ job }: { job: DocGenJob }) {
  const s = normalizeJobStatus(job.status)
  if (s === 'queued')
    return <button type="button" className={`${ghostBtn} border-surface-border text-text-secondary hover:bg-surface-subtle`}>취소</button>
  if (s === 'running')
    return (
      <button type="button" className={`${ghostBtn} border-surface-border text-text-secondary hover:bg-surface-subtle`}>
        <StopIcon className="h-3 w-3" /> 중지
      </button>
    )
  if (s === 'completed')
    return (
      <span className="inline-flex gap-1">
        <button type="button" className={`${ghostBtn} border-brand-soft text-brand hover:bg-brand-subtle`}>
          <DownloadIcon className="h-3.5 w-3.5" /> 받기
        </button>
        <button type="button" aria-label="더보기" className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-subtle">
          <MoreIcon className="h-4 w-4" />
        </button>
      </span>
    )
  return (
    <span className="inline-flex gap-1">
      <button type="button" className={`${ghostBtn} border-brand-soft text-brand hover:bg-brand-subtle`}>
        <RetryIcon className="h-3.5 w-3.5" /> 재시도
      </button>
      <button type="button" className={`${ghostBtn} border-surface-border text-text-secondary hover:border-status-error/40 hover:text-status-error`}>삭제</button>
    </span>
  )
}

/** 미리보기 머리 액션 */
export function PreviewActions({ job }: { job: DocGenJob | null }) {
  if (!job) return null
  const s = normalizeJobStatus(job.status)
  if (s === 'queued' || s === 'running')
    return (
      <button type="button" className={`${ghostBtn} border-surface-border text-text-secondary hover:bg-surface-subtle`}>
        {s === 'queued' ? '요청 취소' : <><StopIcon className="h-3 w-3" /> 중지</>}
      </button>
    )
  if (s === 'completed')
    return (
      <span className="inline-flex flex-wrap gap-1.5">
        <button type="button" className={`${ghostBtn} border-surface-border text-text-secondary hover:bg-surface-subtle`}>
          <RetryIcon className="h-3.5 w-3.5" /> 다시 생성
        </button>
        <button type="button" className={`${ghostBtn} border-surface-border text-text-secondary hover:bg-surface-subtle`}>
          <CopyIcon className="h-3.5 w-3.5" /> 복사
        </button>
        <button type="button" className={`${ghostBtn} border-brand bg-brand text-white hover:bg-brand-hover`}>
          <DownloadIcon className="h-3.5 w-3.5" /> {job.output_format} 받기
        </button>
      </span>
    )
  return null
}

/** 미리보기 본문 (상태별) */
export function PreviewBody({ job, compact = false }: { job: DocGenJob | null; compact?: boolean }) {
  if (!job) return <EmptyPreview />
  const s = normalizeJobStatus(job.status)
  if (s === 'failed') return <FailedNotice job={job} />
  return (
    <div className="flex w-full flex-col gap-4">
      {(s === 'queued' || s === 'running') && (
        <div className="mx-auto w-full max-w-[460px] rounded-2xl border border-surface-border bg-surface p-4">
          <p className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-text-primary">
            {s === 'queued' ? (
              <>대기 중 · 앞에 {job.queue_position}건 <span className="font-normal text-text-muted">· 예상 {formatEta(job.eta_seconds)}</span></>
            ) : (
              <><Spinner className="h-3 w-3 text-brand" /> 작성 중 {job.progress}% <span className="font-normal text-text-muted">· 남은 시간 {formatEta(job.eta_seconds)}</span></>
            )}
          </p>
          <StageSteps job={job} />
          {s === 'queued' && <p className="mt-3 text-[11.5px] text-text-muted">이 화면을 떠나도 생성은 계속됩니다.</p>}
        </div>
      )}
      <Paper job={job} compact={compact} />
    </div>
  )
}

/* ───────── 입력 조각 ───────── */
export function AttachmentChip({ name, size, broken = false }: { name: string; size: number; broken?: boolean }) {
  return (
    <span className={`inline-flex max-w-full items-center gap-2 rounded-xl border py-1.5 pl-2 pr-1 text-[12px] ${broken ? 'border-status-error/40 bg-status-error/5 text-status-error' : 'border-surface-border bg-surface-card1 text-text-secondary'}`}>
      {broken ? <AlertIcon className="h-3.5 w-3.5 shrink-0" /> : <DocIcon className="h-3.5 w-3.5 shrink-0 text-brand" />}
      <span className="truncate font-medium">{name}</span>
      <span className="shrink-0 text-text-muted">{broken ? '읽을 수 없음' : formatBytes(size)}</span>
      <button type="button" aria-label={`${name} 첨부 제거`} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-surface-subtle hover:text-text-primary">
        <XIcon className="h-3 w-3" />
      </button>
    </span>
  )
}

export function OptionChip({ label, icon }: { label: string; icon?: ReactNode }) {
  return (
    <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-text-secondary transition-colors hover:bg-brand-subtle hover:text-brand">
      {icon}
      {label}
      <ChevronIcon className="h-3.5 w-3.5" />
    </button>
  )
}

export function DomainOption({ code }: { code: string | null }) {
  return <OptionChip label={code ? getDomainLabel(code) : '전체'} icon={code ? <DomainIcon code={code} size={14} /> : undefined} />
}
