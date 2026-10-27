// TEMP(시안 비교용) v8 엠블럼 융합: 해병대 엠블럼 미니멀 도안을 조각으로 나눠, 문서가 다 만들어지는 순간 하나로 모은다.
//   대기      → 닻·독수리·별이 가운데를 두고 느리게 돈다 (회색, 흐리게)
//   보냄·대기열 → 네이비로 색이 들어오고 조금 빨라진다. 바깥 고리가 깔린다
//   생성 중   → 진행률만큼 궤도가 좁아지고 회전이 빨라진다. 이중 고리가 진행률만큼 찬다
//   완료      → 제자리로 모이며 네이비 원판이 깔리고 조각·고리가 노랗게 바뀐다. 측면 별이 붙은 뒤 그 아래로 문서가 떠오른다
//   실패·중지 → 조각이 바깥으로 밀려나 멈추고 색이 빠진다. 상태 줄에서 다시 시도할 수 있다
// 도안은 emblemShapes.ts (단색 플랫, currentColor). 진행은 서버(목) 작업 상태를 그대로 따른다.
// 결과는 무작위이고, 프롬프트에 '실패'·'취소'를 넣으면 고정된다.
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { DocGenJob } from '../../../types/docgen'
import { formatBytes, formatClock, formatDuration, formatEta, getJobErrorMessage, normalizeJobStatus } from '../../../utils/docgen'
import { useCancelDocGenJob, useDocGenJobs, useRetryDocGenJob } from '../../../hooks/useDocGen'
import { showToast } from '../../../api/store/toastStore'
import { selectable, useComposer, useFreshIds } from '../../../features/docgen/hooks'
import { AlertIcon, ArrowUpIcon, DocIcon, RetryIcon, StopIcon, XIcon } from '../../../features/docgen/icons'
import {
  ComposerOptions, JobActions, JobProgressText, PreviewActions, PreviewBody, ProgressBar, Spinner, StatusDot,
} from '../../../features/docgen/components'
import DraftBar from './DraftBar'
import { useFreshDraft } from './draftState'
import { ANCHOR_PATHS, EAGLE_PATHS, SIDE_STAR_PATHS, STAR_PATHS } from './emblemShapes'
import './DraftV8.css'

type Stage = 'idle' | 'sending' | 'queued' | 'running' | 'fusing' | 'done' | 'failed'

/** 다 만들어진 뒤 조각이 모여 엠블럼이 되기까지(ms). 이 뒤에 문서가 떠오른다 */
const FUSE_MS = 1100

/* ───────── 엠블럼 ───────── */
const NAVY = '#2C3858'
const YELLOW = '#FFF100'

/** 엠블럼 중심과 원판·고리 반지름 (원본 좌표) */
const O = { x: 243.29, y: 247.74 }
const DISC_R = 226
const OUTER_R = 221
const INNER_R = 209
const OUTER_LEN = 2 * Math.PI * OUTER_R
const INNER_LEN = 2 * Math.PI * INNER_R
/** 조각 묶음은 미니멀 엠블럼처럼 1.12배 키워 가운데에 앉힌다. 궤도 중심 PC가 엠블럼 중심 O에 놓인다 */
const PC = { x: 244.5, y: 264.5 }
const PARTS_TRANSFORM = `translate(${O.x} ${O.y}) scale(1.12) translate(${-PC.x} ${-PC.y})`
const R = 135

/** 도는 조각과 제자리 중심. 그리는 순서대로 닻 → 독수리 → 별 (뒤에서 앞으로) */
const PARTS = [
  { key: 'anchor', paths: ANCHOR_PATHS, home: { x: 251.69, y: 314.75 } },
  { key: 'eagle', paths: EAGLE_PATHS, home: { x: 244.18, y: 207.63 } },
  { key: 'star', paths: STAR_PATHS, home: { x: 243.73, y: 295.25 } },
]
/** 측면 별. 왼쪽 도안을 오른쪽에 거울로 하나 더 */
const SIDE_STAR_MIRROR = `matrix(-1 0 0 1 ${O.x * 2} 0)`

/** 단계별 궤도 목표. k=1이면 궤도 위, 0이면 제자리(합쳐짐). speed는 초당 회전(rad) */
const orbitTarget = (stage: Stage, progress: number) => {
  const p = Math.min(1, Math.max(0, progress / 100))
  switch (stage) {
    case 'idle': return { k: 1, speed: 0.12, rate: 3 }
    case 'sending':
    case 'queued': return { k: 1, speed: 0.7, rate: 3 }
    case 'running': return { k: 1 - 0.72 * p, speed: 0.7 + 1.9 * p, rate: 2.5 }
    case 'fusing':
    case 'done': return { k: 0, speed: 5, rate: 5 }
    case 'failed': return { k: 1.18, speed: 0, rate: 4 }
  }
}

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * 조각 위치를 매 프레임 직접 정한다. 목표(궤도 반지름·속도)가 바뀌면 그쪽으로 부드럽게 따라간다.
 * 궤도 위 자리와 제자리를 k로 섞으므로, k가 0이 되면 회전과 상관없이 엠블럼이 된다
 */
function useOrbit(stage: Stage, progress: number, reduce: boolean) {
  const partRefs = useRef<(SVGGElement | null)[]>([])
  const target = useRef(orbitTarget(stage, progress))
  useEffect(() => { target.current = orbitTarget(stage, progress) })

  useEffect(() => {
    let k = target.current.k
    let speed = target.current.speed
    let angle = -Math.PI / 2
    let last = performance.now()
    let raf = 0
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const t = target.current
      const ease = reduce ? 1 : 1 - Math.exp(-dt * t.rate)
      k += (t.k - k) * ease
      speed += (t.speed - speed) * ease
      if (!reduce) angle += speed * dt
      PARTS.forEach((part, i) => {
        const el = partRefs.current[i]
        if (!el) return
        // 별이 맨 위에서 시작하도록 별 → 독수리 → 닻 순으로 120°씩 벌린다
        const a = angle + ((2 - i) * 2 * Math.PI) / 3
        const x = part.home.x + (PC.x + R * Math.cos(a) - part.home.x) * k
        const y = part.home.y + (PC.y + R * Math.sin(a) - part.home.y) * k
        const tilt = reduce ? 0 : 18 * k * Math.sin(a + i)
        const scale = 0.5 + 0.5 * (1 - Math.min(1, k))
        el.setAttribute('transform', `translate(${x} ${y}) rotate(${tilt}) scale(${scale}) translate(${-part.home.x} ${-part.home.y})`)
      })
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [reduce])

  return partRefs
}

function Emblem({ stage, progress, cancelled, reduce }: { stage: Stage; progress: number; cancelled: boolean; reduce: boolean }) {
  const partRefs = useOrbit(stage, progress, reduce)
  const lit = stage !== 'idle' && stage !== 'failed'
  const fused = stage === 'fusing' || stage === 'done'
  const ringOn = stage !== 'idle'
  const ringValue = fused ? 100 : stage === 'running' || stage === 'failed' ? progress : 0
  const ease = 'cubic-bezier(.32,.72,0,1)'
  // 조각 색: 대기·실패는 회색, 진행 중은 네이비, 합쳐지면 원판 위 노랑
  const ink = fused ? YELLOW : lit ? NAVY : 'var(--color-text-muted)'
  const ringColor = stage === 'failed' ? (cancelled ? 'var(--color-text-muted)' : 'var(--color-status-error)') : NAVY
  const dash = (len: number) => ({ strokeDasharray: len, strokeDashoffset: len * (1 - ringValue / 100) })

  return (
    <div aria-hidden="true" className={`relative mx-auto h-[220px] w-[220px] sm:h-[248px] sm:w-[248px] ${stage === 'fusing' && !reduce ? 'v8-settle' : ''}`}>
      <svg viewBox={`${O.x - 257} ${O.y - 257} 514 514`} className="h-full w-full overflow-visible">
        {/* 바탕 고리 */}
        <circle cx={O.x} cy={O.y} r={OUTER_R} fill="none" stroke="var(--color-surface-border)" strokeWidth="3"
          className="transition-opacity duration-500" style={{ opacity: ringOn ? 1 : 0.5 }} />

        {/* 원판: 다 모이는 순간 가운데서 펼쳐진다 */}
        <circle cx={O.x} cy={O.y} r={DISC_R} fill={NAVY}
          style={{ transformOrigin: `${O.x}px ${O.y}px`, transform: `scale(${fused ? 1 : 0.2})`, opacity: fused ? 1 : 0, transition: `transform 700ms ${ease} 120ms, opacity 300ms 120ms` }} />

        {/* 이중 고리: 진행률만큼 찬다. 합쳐지면 바깥 고리는 원판 가장자리가 되고 안쪽 고리는 노란 테가 된다 */}
        <g transform={`rotate(-90 ${O.x} ${O.y})`} style={{ opacity: ringOn ? 1 : 0, transition: 'opacity 300ms' }}>
          <circle cx={O.x} cy={O.y} r={OUTER_R} fill="none" stroke={ringColor} strokeWidth="6" strokeLinecap="round"
            style={{ ...dash(OUTER_LEN), transition: `stroke-dashoffset 600ms ${ease}, stroke 300ms` }} />
          <circle cx={O.x} cy={O.y} r={INNER_R} fill="none" stroke={fused ? YELLOW : ringColor} strokeWidth={fused ? 4 : 2} strokeLinecap="round"
            style={{ ...dash(INNER_LEN), transition: `stroke-dashoffset 600ms ${ease} 80ms, stroke 400ms 300ms, stroke-width 400ms 300ms` }} />
        </g>

        {/* 합쳐지는 순간 퍼지는 충격파 */}
        {stage === 'fusing' && !reduce && (
          <>
            <circle cx={O.x} cy={O.y} r="90" fill="none" stroke="var(--color-brand)" strokeWidth="5" className="v8-shock" />
            <circle cx={O.x} cy={O.y} r="90" fill="none" stroke={NAVY} strokeWidth="3" className="v8-shock" style={{ animationDelay: '620ms' }} />
          </>
        )}

        {/* 측면 별: 다 모인 뒤 톡 붙는다 */}
        {[undefined, SIDE_STAR_MIRROR].map((mirror, i) => (
          <g key={i} transform={mirror}>
            <g className="v8-pop" data-on={fused} style={{ transitionDelay: fused ? `${560 + i * 80}ms` : '0ms' }}>
              {SIDE_STAR_PATHS.map((d) => <path key={d} d={d} fill={YELLOW} />)}
            </g>
          </g>
        ))}

        {/* 도는 조각. 겹치는 자리는 원판색 테두리로 떼어 놓는다 (미니멀 엠블럼과 같은 방식) */}
        <g transform={PARTS_TRANSFORM} style={{ color: ink, opacity: lit || fused ? 1 : 0.45, transition: 'color 500ms, opacity 500ms' }}>
          {PARTS.map((part, i) => (
            <g key={part.key} ref={(el) => { partRefs.current[i] = el }}>
              {part.key !== 'anchor' && (
                <path d={part.paths[0]} fill={NAVY} stroke={NAVY} strokeWidth="7" strokeLinejoin="round" fillRule="evenodd"
                  style={{ opacity: fused ? 1 : 0, transition: 'opacity 300ms' }} />
              )}
              {part.paths.map((d) => <path key={d} d={d} fill="currentColor" fillRule={part.key === 'star' ? undefined : 'evenodd'} />)}
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}

/* ───────── 엠블럼 아래 상태 ───────── */
function StageStatus({ stage, job, onRetry }: { stage: Stage; job: DocGenJob | null; onRetry: () => void }) {
  if (stage === 'idle' || !job) {
    return (
      <>
        <h1 className="text-[24px] font-bold text-text-primary sm:text-[28px]">어떤 <span className="text-brand">문서</span>를 만들까요?</h1>
        <p className="mt-2 text-[13.5px] text-text-secondary">요청을 적고 양식을 고르면 그 양식에 맞춰 초안을 써 드립니다.</p>
      </>
    )
  }
  if (stage === 'sending') return <p className="flex items-center justify-center gap-2 text-[15px] font-semibold text-text-primary"><Spinner className="h-4 w-4 text-brand" /> 요청을 보내는 중</p>
  if (stage === 'queued') {
    return (
      <>
        <p className="flex items-center justify-center gap-2 text-[15px] font-semibold text-text-primary"><Spinner className="h-4 w-4 text-brand" /> 대기 중 · 앞에 {job.queue_position ?? 0}건</p>
        <p className="mt-1.5 text-[12.5px] text-text-muted">예상 {formatEta(job.eta_seconds)}</p>
      </>
    )
  }
  if (stage === 'running') {
    return (
      <>
        <p className="text-[15px] font-semibold text-text-primary">문서를 쓰는 중 <span className="tabular-nums text-brand">{job.progress}%</span></p>
        <p className="mt-1.5 truncate text-[12.5px] text-text-muted">{job.title} · 남은 시간 {formatEta(job.eta_seconds)}</p>
      </>
    )
  }
  if (stage === 'failed') {
    const cancelled = job.error?.code === 'CANCELLED'
    return (
      <>
        <p className={`flex items-center justify-center gap-1.5 text-[15px] font-semibold ${cancelled ? 'text-text-secondary' : 'text-status-error'}`}>
          <AlertIcon className="h-4 w-4" /> {getJobErrorMessage(job.error?.code)}
        </p>
        <button type="button" onClick={onRetry} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full border border-brand-soft px-4 text-[13px] font-semibold text-brand transition-colors hover:bg-brand-subtle">
          <RetryIcon className="h-3.5 w-3.5" /> 다시 시도 ({job.progress}%에서 멈춤)
        </button>
      </>
    )
  }
  const took = formatDuration(job.started_at ?? job.created_at, job.finished_at)
  const at = formatClock(job.finished_at)
  return (
    <div className={stage === 'done' ? 'v8-rise' : 'opacity-0'}>
      <p className="text-[18px] font-bold text-text-primary">문서 생성 완료</p>
      {(took || at) && <p className="mt-1.5 text-[12.5px] text-text-muted">{[took && `소요 ${took}`, at && `${at} 완료`].filter(Boolean).join(' · ')}</p>}
    </div>
  )
}

/* ───────── 결과 문서 ───────── */
function ResultCard({ job, onClose }: { job: DocGenJob; onClose?: () => void }) {
  const r = job.result
  return (
    <section aria-label="미리보기" className="v8-rise overflow-hidden rounded-[24px] bg-surface shadow-[0_0_0_1px_var(--color-surface-border),0_30px_60px_-24px_rgba(0,0,0,0.16)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-surface-border/70 px-5 py-4">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${r ? 'bg-brand text-white' : 'bg-surface-card1 text-text-muted'}`}><DocIcon className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-text-primary">{r?.file_name ?? job.title}</p>
          <p className="mt-0.5 text-[12px] text-text-secondary">{r ? `${job.output_format} · ${formatBytes(r.size)} · ${r.page_count}쪽` : `${job.template_name} · ${job.output_format}`}</p>
        </div>
        <PreviewActions job={job} />
        {onClose && (
          <button type="button" aria-label="미리보기 닫기" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-primary">
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="bg-surface-card1 p-4 sm:p-6">
        <PreviewBody job={job} compact />
      </div>
    </section>
  )
}

/* ───────── 화면 ───────── */
function Stage() {
  const { jobs, isLoading } = useDocGenJobs()
  const c = useComposer()
  const cancel = useCancelDocGenJob()
  const retry = useRetryDocGenJob()
  const [reduce] = useState(prefersReducedMotion)

  // 입력창에서 보낸 작업. 엠블럼이 이 작업의 서버 상태를 따라 움직인다
  const [liveId, setLiveId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const job = jobs.find((j) => j.job_id === liveId) ?? null
  const s = job ? normalizeJobStatus(job.status) : null

  // 완료를 받은 뒤 엠블럼이 다 합쳐진 작업. 이때부터 문서를 보여 준다
  const [fusedId, setFusedId] = useState<string | null>(null)
  useEffect(() => {
    if (s !== 'completed' || !liveId || fusedId === liveId) return
    const id = window.setTimeout(() => setFusedId(liveId), reduce ? 0 : FUSE_MS)
    return () => clearTimeout(id)
  }, [s, liveId, fusedId, reduce])

  const stage: Stage = sending ? 'sending'
    : !job || !s ? 'idle'
      : s === 'completed' ? (fusedId === liveId ? 'done' : 'fusing')
        : s

  // 생성 문서 목록에서 고른 작업. 고르면 엠블럼 아래 결과 자리에 띄운다
  const [viewId, setViewId] = useState<string | null>(null)
  const viewed = jobs.find((j) => j.job_id === viewId) ?? null
  const resultJob = viewed ?? (stage === 'done' ? job : null)
  const resultRef = useRef<HTMLDivElement>(null)
  // 목록에서 고르면 결과 자리로 올라간다
  useEffect(() => {
    if (viewId) resultRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }, [viewId, reduce])

  // 진행 중인 작업은 끝난 뒤에야 목록에 들어간다
  const settled = stage === 'done' || stage === 'failed'
  const listJobs = jobs.filter((j) => j.job_id !== liveId || settled)
  const isFresh = useFreshIds(jobs.map((j) => j.job_id), !isLoading)

  const active = stage === 'sending' || stage === 'queued' || stage === 'running' || stage === 'fusing'

  const send = async () => {
    if (!c.canSubmit || active) return
    setViewId(null)
    setSending(true)
    const next = await c.submit()
    setSending(false)
    if (!next) return
    setLiveId(next.job_id)
    c.setPrompt('')
  }

  const stop = () => {
    if (liveId) cancel.mutate(liveId, { onError: () => showToast('중지하지 못했습니다. 잠시 후 다시 시도해 주세요.') })
  }

  const retryLive = () => {
    if (!liveId) return
    setViewId(null)
    retry.mutate(liveId, { onError: () => showToast('다시 시도하지 못했습니다. 잠시 후 다시 시도해 주세요.') })
  }

  const view = (id: string) => {
    setViewId(viewId === id ? null : id)
  }

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 pb-24 pt-[6vh] sm:px-6">
      <div className="v8-rise">
        <Emblem stage={stage} progress={job?.progress ?? 0} cancelled={job?.error?.code === 'CANCELLED'} reduce={reduce} />
      </div>

      <div aria-live="polite" className="mt-4 min-h-[76px] text-center">
        <StageStatus stage={stage} job={job} onRetry={retryLive} />
      </div>

      <section aria-label="문서 요청" style={{ '--d': '120ms' } as CSSProperties}
        className={`v8-rise relative z-10 mt-6 rounded-[28px] border bg-surface shadow-[0_12px_30px_rgba(220,20,60,0.05)] transition-[border-color,box-shadow] duration-500 focus-within:shadow-[0_18px_44px_rgba(220,20,60,0.09)] ${active ? 'border-surface-border' : 'border-brand-soft focus-within:border-brand'}`}>
        <label htmlFor="v8-prompt" className="sr-only">프롬프트</label>
        <textarea id="v8-prompt" value={c.prompt} onChange={(e) => c.setPrompt(e.target.value)} readOnly={active} rows={3}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() } }}
          placeholder="만들 문서를 설명해 주세요."
          className={`w-full resize-none bg-transparent px-5 pt-5 text-[15px] leading-relaxed outline-none placeholder:text-text-muted sm:px-6 ${active ? 'text-text-secondary' : 'text-text-primary'}`} />
        <div className="flex flex-wrap items-center gap-1 px-3 pb-3 pt-2">
          <ComposerOptions c={c} disabled={active} withTemplate />
          <span className="flex-1" />
          {active ? (
            <button type="button" aria-label="생성 중지" title="중지" onClick={stop} disabled={stage === 'sending' || stage === 'fusing'}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-surface-border text-text-primary transition-colors hover:bg-surface-subtle disabled:opacity-40">
              <StopIcon className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button type="button" aria-label="생성 요청" onClick={send} disabled={!c.canSubmit}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-light text-white shadow-[0_5px_13px_rgba(220,20,60,0.28)] transition-[scale] duration-200 active:scale-90 disabled:from-surface-subtle disabled:to-surface-subtle disabled:text-text-muted disabled:shadow-none">
              <ArrowUpIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </section>

      <p className="mt-4 text-center text-[11.5px] text-text-muted">MARS v1.0.0은 AI이므로 실수를 할 수 있습니다. 중요한 정보는 재차 확인하십시오.</p>

      {/* 엠블럼이 합쳐진 뒤 떠오르는 문서. 목록에서 고른 문서도 여기 띄운다 */}
      <div ref={resultRef} className="scroll-mt-6">
        {resultJob && (
          <div className="mt-10">
            <ResultCard key={resultJob.job_id} job={resultJob} onClose={viewed ? () => setViewId(null) : undefined} />
          </div>
        )}
      </div>

      <section aria-label="생성 문서" className="v8-rise mt-14" style={{ '--d': '240ms' } as CSSProperties}>
        <h2 className="mb-2.5 px-4 text-[13px] font-semibold text-text-muted">생성 문서 {listJobs.length}</h2>
        {listJobs.length === 0 ? (
          <p className="rounded-[20px] bg-surface px-4 py-8 text-center text-[12.5px] text-text-muted shadow-[0_0_0_1px_var(--color-surface-border)]">
            생성된 문서가 여기에 표시됩니다.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-[20px] bg-surface shadow-[0_0_0_1px_var(--color-surface-border)]">
            {listJobs.map((item, i) => {
              const on = (viewed ? viewId : resultJob?.job_id) === item.job_id
              return (
                <li key={item.job_id} className={isFresh(item.job_id) ? 'animate-docgen-row-in' : ''}>
                  {i > 0 && <div aria-hidden="true" className="ml-8 h-px bg-surface-border/70" />}
                  <div aria-pressed={on} {...selectable(() => view(item.job_id))}
                    className={`group cursor-pointer px-4 py-3 transition-colors duration-200 ${on ? 'bg-brand-subtle' : 'hover:bg-surface-card1 active:bg-surface-subtle'}`}>
                    <div className="flex items-center gap-2">
                      <StatusDot job={item} />
                      <span className={`min-w-0 flex-1 truncate text-[13.5px] font-semibold ${on ? 'text-brand' : 'text-text-primary'}`}>{item.title}</span>
                      <span className="shrink-0 text-[11.5px] text-text-muted">{item.template_name} · {item.output_format}</span>
                    </div>
                    {normalizeJobStatus(item.status) === 'running' && <ProgressBar value={item.progress} className="ml-4 mt-2" />}
                    <div className="mt-1 flex min-h-8 items-center justify-between gap-2 pl-4 text-[11.5px] text-text-muted">
                      <JobProgressText job={item} />
                      <span onClick={(e) => e.stopPropagation()} className={on ? '' : 'lg:opacity-0 lg:group-hover:opacity-100'}><JobActions job={item} /></span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

export default function DraftV8() {
  useFreshDraft()
  return (
    <div className="flex h-full flex-col">
      <DraftBar current="v8" />
      <div className="custom-scroll min-h-0 flex-1 overflow-y-auto">
        <Stage />
      </div>
    </div>
  )
}
