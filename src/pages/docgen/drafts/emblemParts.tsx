// TEMP(시안 비교용) v9~v11 공용 조각. 시안이 정해지면 drafts 폴더째 삭제
// 엠블럼 도안(emblemShapes.ts, 단색 currentColor)과 v7의 미리보기·목록 조각을 함께 쓴다.
import type { CSSProperties } from 'react'
import type { DocGenJob } from '../../../types/docgen'
import { formatBytes, formatClock, formatDuration, getJobErrorMessage, normalizeJobStatus } from '../../../utils/docgen'
import { selectable } from '../../../features/docgen/hooks'
import { AlertIcon, ChevronIcon, DocIcon, DownloadIcon, XIcon } from '../../../features/docgen/icons'
import { JobActions, JobProgressText, PreviewBody, ProgressBar, Spinner, StatusDot } from '../../../features/docgen/components'
import { EAGLE_PATHS, STAR_PATHS } from './emblemShapes'
import { EASE, estimateLeft, formatElapsed, reveal, useNow, useTween } from './emblemHooks'

/* ───────── 엠블럼 조각 (원본 좌표에서 각 조각만 잘라 보이는 상자) ───────── */
export function EagleMark({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="96.76 139.9 294.83 135.45" fill="currentColor" aria-hidden="true">
      {EAGLE_PATHS.map((d, i) => <path key={i} d={d} fillRule="evenodd" />)}
    </svg>
  )
}

export function StarMark({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="169.95 224.95 147.56 140.6" fill="currentColor" aria-hidden="true">
      {STAR_PATHS.map((d, i) => <path key={i} d={d} />)}
    </svg>
  )
}

/**
 * 로프 고리. value가 있으면 그만큼 차고, spin이면 짧은 호가 돈다(진행률을 모르거나, 아직 일하는 중이라는 표시).
 * 둘레에 흰 점선을 겹쳐 꼬인 밧줄처럼 보이게 한다.
 */
export function RopeRing({ size, stroke = 4, value, spin = null, color = 'var(--color-brand)', className = '' }: {
  size: number; stroke?: number; value?: number; spin?: 'fast' | 'slow' | null; color?: string; className?: string
}) {
  const c = size / 2
  const r = c - stroke / 2 - 1
  const len = 2 * Math.PI * r
  const shown = value == null ? 0.28 : Math.min(100, Math.max(0, value)) / 100
  return (
    <svg className={`pointer-events-none ${className}`} width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--color-surface-subtle)" strokeWidth={stroke} />
      <g className={spin === 'fast' ? 'emb-spin' : spin === 'slow' ? 'emb-spin-slow' : ''}>
        <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={len} strokeDashoffset={len * (1 - shown)} transform={`rotate(-90 ${c} ${c})`}
          style={{ transition: `stroke-dashoffset 700ms ${EASE}, stroke 300ms ${EASE}` }} />
        <circle cx={c} cy={c} r={r} fill="none" stroke="#fff" strokeWidth={stroke} strokeDasharray="1.2 3.6" opacity={0.6} />
      </g>
    </svg>
  )
}

/** 그려지며 나타나는 체크 (DraftV7.css의 v7-check) */
export function DrawnCheck({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path className="v7-check" pathLength={1} d="M20 6 9 17l-5-5" />
    </svg>
  )
}

/* ───────── 진행 한 줄 ───────── */
/**
 * 진행 줄 아래 한 줄 상태. 서버는 상태와 진행률만 준다고 보고,
 * 경과 시간은 시작 시각으로, 남은 시간은 지금까지의 속도로 어림한다.
 */
export function StatusLine({ job, finishing = false }: { job: DocGenJob | null; finishing?: boolean }) {
  const s = job ? normalizeJobStatus(job.status) : null
  const now = useNow(s === 'running' || s === 'queued')
  const pct = useTween(job?.progress ?? 0)
  if (!job) return null
  if (finishing || s === 'completed')
    return <><span className="flex items-center gap-1.5 font-semibold text-brand"><DrawnCheck /> 완료</span><span className="tabular-nums">100%</span></>
  if (s === 'failed') {
    const cancelled = job.error?.code === 'CANCELLED'
    const message = cancelled ? '생성을 중지했습니다' : getJobErrorMessage(job.error?.code)
    return (
      <>
        <span title={message} className={`flex min-w-0 items-center gap-1.5 font-semibold ${cancelled ? 'text-text-secondary' : 'text-status-error'}`}>
          <AlertIcon className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{message}</span>
        </span>
        <span className="shrink-0 tabular-nums">{job.progress}%에서 멈춤</span>
      </>
    )
  }
  if (s === 'queued')
    return <><span className="flex items-center gap-1.5 font-semibold text-text-primary"><Spinner className="h-3 w-3 text-text-muted" /> 순서를 기다리는 중</span><span className="shrink-0">곧 시작합니다</span></>
  const left = estimateLeft(job, now)
  return (
    <>
      <span className="flex min-w-0 items-center gap-1.5 font-semibold text-text-primary"><span className="truncate">문서를 만드는 중</span></span>
      <span className="shrink-0 tabular-nums">{[`${pct}%`, `${formatElapsed(job, now)} 경과`, left].filter(Boolean).join(' · ')}</span>
    </>
  )
}

/** 미리보기가 옆 열로 간 뒤 입력창 아래 남는 완료 한 줄 */
export function DoneLine({ job }: { job: DocGenJob | null }) {
  const took = job ? formatDuration(job.started_at ?? job.created_at, job.finished_at) : ''
  const at = job ? formatClock(job.finished_at) : ''
  return (
    <span className="flex min-w-0 items-center gap-1.5 font-semibold text-brand">
      <DrawnCheck className="h-3.5 w-3.5 shrink-0" /> 완료
      {(took || at) && <span className="truncate font-normal text-text-muted">{[took && `소요 ${took}`, at && `${at} 완료`].filter(Boolean).join(' · ')}</span>}
    </span>
  )
}

/* ───────── 미리보기 ───────── */
/** 미리보기: 파일 이름과 다운로드만 두고 아래에 문서를 보여 준다 (v7과 같음) */
export function PreviewCard({ job, open, animate, onClose }: {
  job: DocGenJob | null; open: boolean; animate: boolean
  /** 있으면 오른쪽 미리보기 패널로 그린다 */
  onClose?: () => void
}) {
  if (!job) return null
  const r = job.result
  const panel = !!onClose
  return (
    <div className={`flex flex-col ${panel ? '' : 'gap-4 p-4 sm:p-5'}`}>
      <div className={`flex flex-wrap items-center gap-3 ${panel ? 'sticky top-0 z-10 border-b border-surface-border/60 bg-surface/75 px-5 py-4 backdrop-blur-xl backdrop-saturate-150' : ''}`}
        style={reveal(open, animate, 240)}>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${r ? 'bg-brand text-white' : 'bg-surface-card1 text-text-muted'}`}><DocIcon className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-text-primary">{r?.file_name ?? job.title}</p>
          <p className="mt-0.5 text-[12px] text-text-secondary">{r ? `${job.output_format} · ${formatBytes(r.size)} · ${r.page_count}쪽` : `${job.template_name} · ${job.output_format}`}</p>
        </div>
        <div className="flex gap-2 max-sm:w-full">
          {r && (
            <button type="button" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-brand px-5 text-[13.5px] font-bold text-white shadow-[0_6px_16px_rgba(220,20,60,0.25)] transition-[background-color,scale] duration-200 hover:bg-brand-hover active:scale-[.96] max-sm:flex-1">
              <DownloadIcon className="h-4 w-4" /> 다운로드
            </button>
          )}
          {panel && (
            <button type="button" aria-label="미리보기 닫기" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-[background-color,color,scale] duration-200 hover:bg-surface-subtle hover:text-text-primary active:scale-90">
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <section aria-label="미리보기" className={`overflow-hidden rounded-2xl border bg-surface-card1 p-4 sm:p-6 ${panel ? 'm-5 border-surface-border' : 'border-brand-soft'}`} style={reveal(open, animate, 360)}>
        <PreviewBody job={job} compact />
      </section>
    </div>
  )
}

/* ───────── 생성 문서 목록 (v7과 같음) ───────── */
export function JobList({ jobs, isFresh, selectedId, justDoneId, wide, onView }: {
  jobs: DocGenJob[]; isFresh: (id: string) => boolean
  /** 미리보는 줄 (넓은 화면: 오른쪽 패널에 떠 있는 줄, 좁은 화면: 아래로 펼친 줄) */
  selectedId: string | null
  justDoneId: string | null
  wide: boolean
  onView: (id: string) => void
}) {
  return (
    <>
      <h2 className="mb-2.5 px-4 text-[13px] font-semibold text-text-muted">생성 문서 {jobs.length}</h2>
      {jobs.length === 0 && (
        <p className="rounded-[20px] bg-surface px-4 py-8 text-center text-[12.5px] text-text-muted shadow-[0_0_0_1px_var(--color-surface-border)]">
          생성된 문서가 여기에 표시됩니다.
        </p>
      )}
      <ul className={`overflow-hidden rounded-[20px] bg-surface shadow-[0_0_0_1px_var(--color-surface-border)] ${jobs.length ? '' : 'hidden'}`}>
        {jobs.map((item, i) => {
          const on = selectedId === item.job_id
          return (
            <li key={item.job_id} className={isFresh(item.job_id) ? 'animate-docgen-row-in' : ''}>
              {i > 0 && <div aria-hidden="true" className="ml-8 h-px bg-surface-border/70" />}
              <div aria-pressed={on} {...selectable(() => onView(item.job_id))}
                className={`group cursor-pointer px-4 py-3 transition-colors duration-200 ${on ? 'bg-brand-subtle' : 'hover:bg-surface-card1 active:bg-surface-subtle'}`}>
                <div className="flex items-center gap-2">
                  <StatusDot job={item} />
                  <span className={`min-w-0 flex-1 truncate text-[13.5px] font-semibold ${on ? 'text-brand' : 'text-text-primary'}`}>{item.title}</span>
                  {justDoneId === item.job_id && <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[10.5px] font-bold text-white">방금</span>}
                  <span className="shrink-0 text-[11.5px] text-text-muted">{item.template_name} · {item.output_format}</span>
                  <ChevronIcon className={`h-3.5 w-3.5 shrink-0 text-text-muted transition-[rotate,translate] duration-300 ${!wide && on ? 'rotate-0' : '-rotate-90 group-hover:translate-x-0.5'}`} />
                </div>
                {normalizeJobStatus(item.status) === 'running' && <ProgressBar value={item.progress} className="ml-4 mt-2" />}
                <div className="mt-1 flex min-h-8 items-center justify-between gap-2 pl-4 text-[11.5px] text-text-muted">
                  <JobProgressText job={item} />
                  <span onClick={(e) => e.stopPropagation()} className={on ? '' : 'lg:opacity-0 lg:group-hover:opacity-100'}><JobActions job={item} /></span>
                </div>
              </div>
              {!wide && on && (
                <div className="border-t border-surface-border/70 bg-surface-card2">
                  <PreviewCard job={item} open animate={false} />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}
