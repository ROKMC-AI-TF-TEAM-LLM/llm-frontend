// TEMP(시안 비교용) v6 전송 모션: 대화형 입력창의 전송 버튼이 진행 막대로 바뀐다.
//   전송      → 버튼이 아래로 내려간 뒤 왼쪽으로 선을 그으며 이동하고, 그 선이 진행 막대가 된다
//   생성 중   → 막대 오른쪽 끝이 둥글게 떨어져 나가 중지 버튼이 된다
//   완료      → 중지 버튼이 다시 붙고, 막대가 미리보기가 된다 (v5처럼 배치가 상태를 따라간다)
//               넓은 화면: 입력 열이 왼쪽으로 비켜나고, 막대가 오른쪽 열로 미끄러지며 늘어난 뒤 위아래로 펼쳐진다
//               좁은 화면: 막대가 그 자리에서 아래로 펼쳐진다
//   실패·중지 → 막대가 멈춘 자리에서 색이 바뀌고, 떨어진 버튼은 다시 시도 버튼이 된다
// 미리보기를 닫으면 한 열로 돌아가고, 새로 보내면 미리보기를 접은 뒤 처음부터 재생한다.
// 진행률·소요 시간 같은 진행 정보는 미리보기 위가 아니라 진행 줄과 아래 생성 문서 목록에 둔다.
// 생성 문서 목록에서 다른 문서를 골라도 미리보기 크기는 그대로다.
// 보낸 작업은 진행 줄에서 따라가다가, 끝나면(완료·실패·취소) 생성 문서 목록에 새 줄로 내려앉는다.
// 진행은 서버(목) 작업 상태를 그대로 따른다. 결과는 무작위이고, 프롬프트에 '실패'·'취소'를 넣으면 고정된다.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import type { DocGenJob } from '../../../types/docgen'
import { formatBytes, formatClock, formatDuration, formatEta, getJobErrorMessage, normalizeJobStatus } from '../../../utils/docgen'
import { useCancelDocGenJob, useDocGenJobs, useRetryDocGenJob } from '../../../hooks/useDocGen'
import { showToast } from '../../../api/store/toastStore'
import { selectable, useComposer, useFreshIds } from '../../../features/docgen/hooks'
import { AlertIcon, ArrowUpIcon, CheckIcon, DocIcon, DownloadIcon, RetryIcon, StopIcon, XIcon } from '../../../features/docgen/icons'
import {
  ComposerOptions, JobActions, JobProgressText, PreviewBody, ProgressBar, Spinner, StatusDot,
} from '../../../features/docgen/components'
import DraftBar from './DraftBar'
import { useFreshDraft } from './draftState'

type Phase = 'compose' | 'drop' | 'draw' | 'merge' | 'track' | 'rejoin' | 'shift' | 'land' | 'done' | 'failed' | 'closing'

/** 단계별 움직임 시간(ms) */
const T = { drop: 450, draw: 750, merge: 420, hold: 240, detach: 650, rejoin: 520, shift: 720, open: 800, close: 380 }
const EASE = 'cubic-bezier(.4,0,.2,1)'
const EASE_DRAW = 'cubic-bezier(.65,0,.35,1)'

const SEND = 40 // 전송 버튼 지름
const STOP = 36 // 떨어져 나온 버튼 지름
const BAR = 6 // 막대 두께
const GAP = 12 // 막대와 떨어진 버튼 사이
const LANE_H = 64 // 진행 줄 높이
const DONE_H = 44 // 미리보기가 옆으로 간 뒤 남는 완료 줄 높이
const BAR_Y = 22 // 진행 줄 안에서 막대 중심

const TRACK_COLOR = 'var(--color-surface-border)'

interface Geo { slotX: number; slotY: number; laneTop: number; width: number; cardH: number }

/** 넓은 화면이면 미리보기를 오른쪽 열에 띄운다 */
const WIDE = '(min-width: 1024px)'
const readViewport = () => ({ wide: window.matchMedia(WIDE).matches, h: window.innerHeight })
const easeOut = (t: number) => 1 - (1 - t) ** 3
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)

const box = (x: number, y: number, w: number, h: number): CSSProperties => ({ transform: `translate(${x}px, ${y}px)`, width: w, height: h })

/** 예약한 타이머를 한 번에 지운다 (화면을 떠나거나 다시 시작할 때) */
function useTimers() {
  const ids = useRef<number[]>([])
  const frames = useRef<number[]>([])
  const later = useCallback((ms: number, fn: () => void) => { ids.current.push(window.setTimeout(fn, ms)) }, [])
  const every = useCallback((ms: number, fn: () => void) => { ids.current.push(window.setInterval(fn, ms)) }, [])
  const frame = useCallback((fn: FrameRequestCallback) => { frames.current.push(requestAnimationFrame(fn)) }, [])
  const clear = useCallback(() => {
    ids.current.forEach((id) => { clearTimeout(id); clearInterval(id) })
    frames.current.forEach((id) => cancelAnimationFrame(id))
    ids.current = []
    frames.current = []
  }, [])
  useEffect(() => clear, [clear])
  return { later, every, frame, clear }
}

function useViewport() {
  const [vp, setVp] = useState(readViewport)
  useEffect(() => {
    const on = () => setVp(readViewport())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return vp
}

/** 전송 자리·진행 줄·결과 칸을 감싼 상자 기준으로 잰다. 창 크기나 입력창 높이가 바뀌면 다시 잰다 */
function useGeometry() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const laneRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [geo, setGeo] = useState<Geo | null>(null)
  const [ready, setReady] = useState(false)
  useLayoutEffect(() => {
    const [wrap, composer, slot, lane, card] = [wrapRef.current, composerRef.current, slotRef.current, laneRef.current, cardRef.current]
    if (!wrap || !composer || !slot || !lane || !card) return
    const measure = () => {
      const w = wrap.getBoundingClientRect()
      const s = slot.getBoundingClientRect()
      const next: Geo = { slotX: s.left - w.left, slotY: s.top - w.top, laneTop: lane.getBoundingClientRect().top - w.top, width: w.width, cardH: card.offsetHeight }
      setGeo((prev) => (prev && (Object.keys(next) as (keyof Geo)[]).every((k) => prev[k] === next[k]) ? prev : next))
    }
    measure()
    // 처음 자리를 잡은 뒤에야 움직임을 켠다 (0,0에서 날아오지 않게)
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)))
    const ro = new ResizeObserver(measure)
    ;[wrap, composer, card].forEach((el) => ro.observe(el))
    return () => { ro.disconnect(); cancelAnimationFrame(raf) }
  }, [])
  return { geo, ready, wrapRef, composerRef, slotRef, laneRef, cardRef }
}

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ───────── 진행 줄 아래 한 줄 상태 ───────── */
function StatusLine({ job, phase }: { job: DocGenJob | null; phase: Phase }) {
  if (!job) return null
  const s = normalizeJobStatus(job.status)
  if (phase === 'rejoin' || s === 'completed')
    return <><span className="flex items-center gap-1.5 font-semibold text-brand"><CheckIcon className="h-3.5 w-3.5" /> 완료</span><span className="tabular-nums">100%</span></>
  if (s === 'failed') {
    const cancelled = job.error?.code === 'CANCELLED'
    const message = getJobErrorMessage(job.error?.code)
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
    return <><span className="flex items-center gap-1.5 font-semibold text-text-primary"><Spinner className="h-3 w-3 text-brand" /> 대기 중 · 앞에 {job.queue_position ?? 0}건</span><span className="shrink-0">예상 {formatEta(job.eta_seconds)}</span></>
  return (
    <>
      <span className="flex min-w-0 items-center gap-1.5 font-semibold text-text-primary"><Spinner className="h-3 w-3 shrink-0 text-brand" /><span className="truncate">생성 중</span></span>
      <span className="shrink-0 tabular-nums">{job.progress}% · 남은 시간 {formatEta(job.eta_seconds)}</span>
    </>
  )
}

/** 미리보기가 옆 열로 간 뒤 입력창 아래 남는 완료 한 줄. 소요·완료 시각은 미리보기가 아니라 여기서 보여 준다 */
function DoneLine({ job }: { job: DocGenJob | null }) {
  const took = job ? formatDuration(job.started_at ?? job.created_at, job.finished_at) : ''
  const at = job ? formatClock(job.finished_at) : ''
  return (
    <span className="flex min-w-0 items-center gap-1.5 font-semibold text-brand">
      <CheckIcon className="h-3.5 w-3.5 shrink-0" />
      {(took || at) && <span className="truncate font-normal text-text-muted">{[took && `소요 ${took}`, at && `${at} 완료`].filter(Boolean).join(' · ')}</span>}
    </span>
  )
}

/* ───────── 막대가 펼쳐져 된 결과 칸 ───────── */
/** 펼쳐진 칸 안의 한 덩어리가 차례로 떠오르게 한다 */
const reveal = (open: boolean, animate: boolean, delay: number): CSSProperties => ({
  opacity: open ? 1 : 0,
  transform: open ? 'none' : 'translateY(10px)',
  transition: animate ? `opacity 320ms ${EASE} ${open ? delay : 0}ms, transform 420ms ${EASE} ${open ? delay : 0}ms` : 'none',
})

/** 미리보기: 파일 이름과 다운로드만 두고 아래에 문서를 보여 준다 */
function PreviewCard({ job, open, animate, onClose }: {
  job: DocGenJob | null; open: boolean; animate: boolean
  /** 있으면 오른쪽 미리보기 패널로 그린다 */
  onClose?: () => void
}) {
  if (!job) return null
  const r = job.result
  const panel = !!onClose
  return (
    <div className={`flex flex-col gap-4 ${panel ? 'p-5' : 'p-4 sm:p-5'}`}>
      <div className="flex flex-wrap items-center gap-3" style={reveal(open, animate, 240)}>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${r ? 'bg-brand text-white' : 'bg-surface-card1 text-text-muted'}`}><DocIcon className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-text-primary">{r?.file_name ?? job.title}</p>
          <p className="mt-0.5 text-[12px] text-text-secondary">{r ? `${job.output_format} · ${formatBytes(r.size)} · ${r.page_count}쪽` : `${job.template_name} · ${job.output_format}`}</p>
        </div>
        <div className="flex gap-2 max-sm:w-full">
          {r && (
            <button type="button" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-brand px-5 text-[13.5px] font-bold text-white shadow-[0_6px_16px_rgba(220,20,60,0.25)] transition-colors hover:bg-brand-hover max-sm:flex-1">
              <DownloadIcon className="h-4 w-4" /> 다운로드
            </button>
          )}
          {panel && (
            <button type="button" aria-label="미리보기 닫기" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-primary">
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 문서: 막대가 다 펼쳐질 즈음 아래에서 떠오른다 */}
      <section aria-label="미리보기" className={`overflow-hidden rounded-2xl border bg-surface-card1 p-4 sm:p-6 ${panel ? 'border-surface-border' : 'border-brand-soft'}`} style={reveal(open, animate, 360)}>
        <PreviewBody job={job} compact />
      </section>
    </div>
  )
}

/* ───────── 화면 ───────── */
function Stage() {
  const { jobs, isLoading } = useDocGenJobs()
  const c = useComposer()
  const cancel = useCancelDocGenJob()
  const retry = useRetryDocGenJob()
  // 입력창에서 보낸 작업. 진행 줄이 이 작업의 서버 상태를 따라 움직인다
  const [liveId, setLiveId] = useState<string | null>(null)
  // 요청 응답을 기다리는 중 (이때는 진행 줄이 예전 상태에 반응하지 않는다)
  const [awaiting, setAwaiting] = useState(false)
  const job = jobs.find((j) => j.job_id === liveId) ?? null
  const liveState = job ? normalizeJobStatus(job.status) : null
  const [phase, setPhase] = useState<Phase>('compose')
  // 다시 보낼 때 한 번 움직임 없이 처음 자리로 되돌린다
  const [instant, setInstant] = useState(false)
  const [reduce] = useState(prefersReducedMotion)
  const { later, frame, clear } = useTimers()

  const { geo, ready, wrapRef, composerRef, slotRef, laneRef, cardRef } = useGeometry()
  const pageRef = useRef<HTMLDivElement>(null)
  const asideRef = useRef<HTMLElement>(null)
  const panelBoxRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const flyRef = useRef<HTMLDivElement>(null)

  // v5처럼 배치가 상태를 따라간다: 미리보기가 열리면 두 열, 닫히면 가운데 한 열
  const vp = useViewport()
  const wideRef = useRef(vp.wide)
  useEffect(() => { wideRef.current = vp.wide })
  const [sideOpen, setSideOpen] = useState(false)
  const side = vp.wide && sideOpen
  // 생성 문서 목록에서 고른 작업. null이면 입력창에서 보낸 작업을 미리본다
  const [viewId, setViewId] = useState<string | null>(null)
  const viewed = jobs.find((j) => j.job_id === viewId) ?? null
  // 막대가 내려앉은 높이(패널 상자 기준). 여기서부터 위아래로 펼쳐진다
  const [panelFrom, setPanelFrom] = useState(0)

  // 진행 줄에 있는 작업은 끝난 뒤에야 생성 문서 목록에 들어간다
  const settled = phase === 'done' || phase === 'failed' || phase === 'closing'
  const listJobs = jobs.filter((j) => j.job_id !== liveId || settled)
  const isFresh = useFreshIds(jobs.map((j) => j.job_id), !isLoading)

  const { canSubmit } = c
  const editable = phase === 'compose' || phase === 'done' || phase === 'failed'

  /** 넓은 화면 완료: 입력 열이 비켜나는 동안 막대가 오른쪽 열로 미끄러지며 늘어나고, 내려앉으면 위아래로 펼쳐진다 */
  const shift = () => {
    const [page, fill, aside, fly, panelBox] = [pageRef.current, fillRef.current, asideRef.current, flyRef.current, panelBoxRef.current]
    if (!page || !fill || !aside || !fly || !panelBox) return setPhase('done')
    const pr = page.getBoundingClientRect()
    const fr = fill.getBoundingClientRect()
    const y = fr.top - pr.top
    const [l0, r0] = [fr.left - pr.left, fr.right - pr.left]
    const place = (l: number, r: number) => {
      fly.style.transform = `translate(${l}px, ${y}px)`
      fly.style.width = `${Math.max(BAR, r - l)}px`
    }
    const land = () => {
      setPanelFrom(page.getBoundingClientRect().top + y - panelBox.getBoundingClientRect().top)
      setPhase('land')
      later(40, () => setPhase('done'))
    }
    place(l0, r0)
    setSideOpen(true)
    setPhase('shift')
    if (reduce) return land()
    // 오른쪽 열은 자라는 중이라 매 프레임 다시 재서 따라간다. 오른쪽 끝이 먼저 달려가고 왼쪽 끝이 뒤따른다
    const t0 = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / T.shift)
      const p = page.getBoundingClientRect()
      const a = aside.getBoundingClientRect()
      place(l0 + (a.left - p.left - l0) * easeInOut(t), r0 + (a.right - p.left - r0) * easeOut(t))
      if (t < 1) frame(step)
      else land()
    }
    frame(step)
  }

  /** 다 만들어짐: 중지 버튼이 다시 붙고 → 막대가 미리보기로 펼쳐진다 */
  const finish = () => {
    setPhase('rejoin')
    // 다 만들면 미리보기를 방금 만든 문서로 바꾼다
    later(T.rejoin, () => setViewId(null))
    later(T.rejoin + 80, () => {
      if (wideRef.current) return shift()
      setPhase('done')
      // 펼쳐지는 칸이 화면 밖으로 내려가면 따라 내려간다
      later(T.open * 0.5, () => cardRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' }))
    })
  }

  // 진행 줄은 서버 작업 상태를 따라간다. 상태 전환은 타이머로 넘겨 효과 안에서 바로 바꾸지 않는다
  useEffect(() => {
    if (awaiting) return
    if (phase === 'track' && liveState === 'completed') later(0, finish)
    else if (phase === 'track' && liveState === 'failed') later(0, () => setPhase('failed'))
    // 목록에서 실패한 작업을 재시도하면 다시 진행 줄로 돌아온다
    else if (phase === 'failed' && (liveState === 'queued' || liveState === 'running')) later(0, () => setPhase('track'))
    // finish·later는 이 상태 변화에만 반응하면 된다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, liveState, awaiting])

  /** 전송 → 내려감 → 선 긋기 → 막대로 합쳐짐 → 끝이 떨어져 중지 버튼. 움직이는 동안 요청을 보낸다 */
  const play = (start: () => Promise<DocGenJob | null>, keepLive = false) => {
    clear()
    setInstant(false)
    if (!keepLive) setLiveId(null)
    setAwaiting(true)
    setPhase('drop')
    let at = T.drop
    later(at, () => setPhase('draw'))
    at += T.draw
    later(at, () => setPhase('merge'))
    at += T.merge + T.hold
    later(at, () => setPhase('track'))
    start().then((next) => {
      setAwaiting(false)
      if (next) return setLiveId(next.job_id)
      // 보내지 못하면 처음 자리로 되돌린다
      clear()
      setInstant(true)
      setPhase('compose')
    })
  }

  /** 결과·실패 화면에서 다시 보낼 때: 미리보기를 접고 → 처음 자리로 → 재생 */
  const restart = (start: () => Promise<DocGenJob | null>, keepLive = false) => {
    clear()
    setPhase('closing')
    setSideOpen(false)
    later(side ? T.shift : T.close, () => {
      setInstant(true)
      setPhase('compose')
      later(50, () => play(start, keepLive))
    })
  }

  /** 생성 문서 목록에서 고르기. 넓은 화면은 오른쪽 미리보기, 좁은 화면은 그 줄 아래에 펼친다 */
  const view = (id: string) => {
    if (!vp.wide && viewId === id) return setViewId(null)
    setViewId(id)
    setSideOpen(true)
  }

  const send = () => {
    if (!canSubmit) return
    if (phase === 'compose') play(c.submit)
    else if (phase === 'done' || phase === 'failed') restart(c.submit)
  }

  const stop = () => {
    if (liveId) cancel.mutate(liveId, { onError: () => showToast('중지하지 못했습니다. 잠시 후 다시 시도해 주세요.') })
  }

  /** 떨어진 버튼(다시 시도): 같은 작업을 다시 돌린다 */
  const retryLive = () => {
    const id = liveId
    if (!id) return
    restart(() => retry.mutateAsync(id).then((res) => res.data.data).catch(() => {
      showToast('다시 시도하지 못했습니다. 잠시 후 다시 시도해 주세요.')
      return null
    }), true)
  }

  /* ── 좌표 ── */
  const g = geo ?? { slotX: 0, slotY: 0, laneTop: 0, width: 0, cardH: 0 }
  const trackR = g.slotX + SEND
  const trackL = Math.max(0, g.width - trackR)
  const fullW = Math.max(0, trackR - trackL)
  const shortW = Math.max(BAR, fullW - STOP - GAP)
  const cy = g.laneTop + BAR_Y
  const barTop = cy - BAR / 2

  const animate = ready && !instant && !reduce
  const tr = (parts: [string, number, string?, number?][]) =>
    animate ? parts.map(([prop, ms, ease = EASE, delay = 0]) => `${prop} ${ms}ms ${ease} ${delay}ms`).join(', ') : 'none'

  const isDone = phase === 'done' || phase === 'closing'
  const detached = phase === 'track' || phase === 'failed'
  // 넓은 화면에서는 완료 막대를 오른쪽 열에 넘겨주고, 좁은 화면에서는 그 자리에서 아래로 펼친다
  const handedOff = vp.wide && (phase === 'shift' || phase === 'land' || isDone)
  const sheet = !vp.wide && isDone
  const cancelled = job?.error?.code === 'CANCELLED'

  // 전송 버튼(모양) — 입력창 자리 → 아래 → 왼쪽 끝 → 막대 머리로 줄어듦
  const pillOn = phase === 'compose' || phase === 'drop' || phase === 'draw' || phase === 'merge'
  const pillBox =
    phase === 'compose' ? box(g.slotX, g.slotY, SEND, SEND)
      : phase === 'drop' ? box(g.slotX, cy - SEND / 2, SEND, SEND)
        : phase === 'draw' ? box(trackL, cy - SEND / 2, SEND, SEND)
          : box(trackL, barTop, BAR, BAR)
  const pillMs = phase === 'draw' ? T.draw : phase === 'merge' ? T.merge : T.drop
  const pillStyle: CSSProperties = {
    ...pillBox, opacity: pillOn ? 1 : 0,
    transition: tr([['transform', pillMs, phase === 'draw' ? EASE_DRAW : EASE], ['width', pillMs], ['height', pillMs], ['opacity', 0]]),
  }

  // 선(=막대 바탕) — 버튼을 따라 오른쪽에서 왼쪽으로 그려지고, 끝이 떨어지면 짧아진다
  const drawn = !(phase === 'compose' || phase === 'drop')
  const trackStyle: CSSProperties = {
    transform: `translate(${trackL}px, ${barTop}px) scaleX(${drawn ? 1 : 0})`,
    transformOrigin: 'right center',
    width: detached ? shortW : fullW,
    height: BAR,
    backgroundColor: phase === 'drop' || phase === 'draw' ? 'var(--color-brand)' : TRACK_COLOR,
    opacity: handedOff ? 0 : 1,
    transition: tr([['transform', T.draw, EASE_DRAW], ['width', phase === 'rejoin' ? T.rejoin : T.detach], ['background-color', T.merge], ['opacity', 250]]),
  }

  // 떨어져 나오는 끝 조각 — 막대 끝의 점이 부풀며 떨어져 원이 된다
  const blobD = detached ? STOP : BAR
  const blobCx = trackR - blobD / 2
  const blobStyle: CSSProperties = {
    ...box(blobCx - blobD / 2, cy - blobD / 2, blobD, blobD),
    opacity: detached || phase === 'rejoin' ? 1 : 0,
    backgroundColor: TRACK_COLOR,
    transition: tr([['transform', phase === 'rejoin' ? T.rejoin : T.detach], ['width', phase === 'rejoin' ? T.rejoin : T.detach], ['height', phase === 'rejoin' ? T.rejoin : T.detach], ['opacity', 0]]),
  }

  // 진행 채움 — 좁은 화면에서는 완료되면 그대로 아래로 펼쳐져 결과 칸이 된다
  const fillOn = (detached || phase === 'rejoin' || sheet) && !handedOff
  const fillW = phase === 'rejoin' || handedOff ? fullW : BAR + ((shortW - BAR) * (job?.progress ?? 0)) / 100
  const fillStyle: CSSProperties = sheet
    ? {
      ...box(0, g.laneTop, g.width, g.cardH), borderRadius: 20, opacity: phase === 'closing' ? 0 : 1,
      backgroundColor: 'var(--color-brand-subtle)', boxShadow: 'inset 0 0 0 1px var(--color-brand-soft)',
      transition: tr([['transform', T.open], ['width', T.open], ['height', T.open], ['border-radius', T.open], ['background-color', T.open], ['box-shadow', T.open], ['opacity', T.close]]),
    }
    : {
      ...box(trackL, barTop, fillW, BAR), borderRadius: BAR / 2, opacity: fillOn ? 1 : 0,
      backgroundColor: phase === 'failed' ? (cancelled ? 'var(--color-text-muted)' : 'var(--color-status-error)') : 'var(--color-brand)',
      boxShadow: 'inset 0 0 0 1px transparent',
      transition: tr([['transform', 300], ['width', phase === 'rejoin' ? T.rejoin : 500], ['background-color', 300], ['opacity', 0]]),
    }

  // 오른쪽 미리보기 패널 — 내려앉은 막대(land)에서 위아래로 펼쳐진다. 목록에서 고른 작업이면 바로 보인다
  const panelJob = viewed ?? job
  const panelOn = side && (viewed ? phase !== 'shift' && phase !== 'land' && phase !== 'closing' : phase === 'land' || phase === 'done')
  // 어떤 상태의 문서를 띄워도 패널 크기는 같게 둔다
  const panelH = Math.max(320, vp.h - 150)
  const panelStyle: CSSProperties = phase === 'land'
    ? { transform: `translateY(${panelFrom}px)`, height: BAR, borderRadius: BAR / 2, backgroundColor: 'var(--color-brand)', boxShadow: '0 0 0 1px transparent', transition: 'none' }
    : {
      transform: 'none', height: panelH, borderRadius: 20, opacity: panelOn ? 1 : 0,
      backgroundColor: 'var(--color-surface)', boxShadow: '0 0 0 1px var(--color-surface-border), 0 12px 32px rgba(0,0,0,0.06)',
      transition: tr([['transform', T.open], ['height', T.open], ['border-radius', T.open], ['background-color', T.open * 0.6], ['box-shadow', T.open], ['opacity', T.close]]),
    }

  const laneH = phase === 'compose' || phase === 'closing' ? 0 : sheet ? g.cardH : handedOff ? DONE_H : LANE_H
  const lineOn = detached || phase === 'rejoin' || (handedOff && phase !== 'closing')
  const showResend = phase === 'done' || phase === 'failed' || phase === 'closing'
  const sendClass = canSubmit
    ? 'bg-gradient-to-br from-brand to-brand-light text-white'
    : 'bg-surface-subtle text-text-muted'

  return (
    <div ref={pageRef} className="relative mx-auto w-full max-w-[1360px] px-4 pb-16 pt-[10vh] sm:px-6 lg:grid"
      style={{ gridTemplateColumns: side ? 'minmax(0,0.9fr) minmax(0,1.1fr)' : 'minmax(0,1fr) minmax(0,0fr)', columnGap: side ? 32 : 0, transition: tr([['grid-template-columns', T.shift], ['column-gap', T.shift]]) }}>
      {/* 막대 끝이 떨어져 나갈 때 액체처럼 늘어났다 끊기게 하는 필터 */}
      <svg aria-hidden="true" className="absolute h-0 w-0">
        <filter id="v6-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </svg>

      <div className="mx-auto w-full min-w-0 max-w-[720px]">
      <h1 className="text-center text-[24px] font-bold text-text-primary sm:text-[28px]">
        어떤 <span className="text-brand">문서</span>를 만들까요?
      </h1>
      <p className="mt-2 text-center text-[13.5px] text-text-secondary">요청을 적고 양식을 고르면 그 양식에 맞춰 초안을 써 드립니다.</p>

      <div ref={wrapRef} className="relative mt-7">
        <section ref={composerRef} aria-label="문서 요청"
          className={`rounded-[28px] border bg-surface shadow-[0_12px_30px_rgba(220,20,60,0.05)] transition-colors ${editable ? 'border-brand-soft focus-within:border-brand' : 'border-surface-border'}`}>
          <label htmlFor="v6-prompt" className="sr-only">프롬프트</label>
          <textarea id="v6-prompt" value={c.prompt} onChange={(e) => c.setPrompt(e.target.value)} readOnly={!editable} rows={3}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() } }}
            placeholder="만들 문서를 설명해 주세요."
            className={`w-full resize-none bg-transparent px-5 pt-5 text-[15px] leading-relaxed outline-none placeholder:text-text-muted sm:px-6 ${editable ? 'text-text-primary' : 'text-text-secondary'}`} />
          <div className="flex flex-wrap items-center gap-1 px-3 pb-3 pt-2">
            <ComposerOptions c={c} disabled={!editable} withTemplate />
            <span className="flex-1" />
            {/* 전송 자리. 처음에는 위 겹의 움직이는 버튼이 여기 앉고, 결과·실패 뒤에는 새 버튼이 돋아난다 */}
            <div ref={slotRef} className="h-10 w-10 shrink-0">
              <button type="button" aria-label="다시 생성 요청" tabIndex={showResend ? 0 : -1} disabled={!canSubmit || phase === 'closing'} onClick={send}
                className={`flex h-10 w-10 items-center justify-center rounded-full ${sendClass} ${showResend ? 'scale-100 opacity-100' : 'pointer-events-none scale-50 opacity-0'} ${canSubmit ? 'shadow-[0_5px_13px_rgba(220,20,60,0.28)]' : ''}`}
                style={{ transition: showResend && animate ? `opacity 300ms ${EASE} 200ms, transform 300ms ${EASE} 200ms` : 'none' }}>
                <ArrowUpIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>

        {/* 진행 줄: 높이만 차지하고, 그림은 위 겹에서 그린다 */}
        <div ref={laneRef} style={{ height: laneH, transition: tr([['height', phase === 'closing' ? T.close : sheet ? T.open : T.drop]]) }} />

        <div className="pointer-events-none absolute inset-0" style={{ visibility: geo ? 'visible' : 'hidden' }}>
          {/* 모양 겹 (goo 필터) */}
          <div className="absolute inset-0" style={{ filter: 'url(#v6-goo)' }}>
            <span className={`absolute left-0 top-0 rounded-full ${phase === 'compose' ? sendClass : 'bg-gradient-to-br from-brand to-brand-light'}`} style={pillStyle} />
            <span className="absolute left-0 top-0 rounded-full" style={trackStyle} />
            <span className="absolute left-0 top-0 rounded-full" style={blobStyle} />
          </div>

          {/* 진행 채움 → 결과 칸 */}
          <div ref={fillRef} className={`absolute left-0 top-0 overflow-hidden ${sheet && phase === 'done' ? 'pointer-events-auto' : ''}`} style={fillStyle}>
            <div ref={cardRef} inert={!(sheet && phase === 'done')} style={{ width: g.width }}>
              {!vp.wide && <PreviewCard key={job?.job_id} job={job} open={phase === 'done'} animate={animate} />}
            </div>
          </div>

          {/* 누르는 겹 (필터 없이 아이콘·글자) */}
          <button type="button" aria-label="생성 요청" disabled={!canSubmit || phase !== 'compose'} tabIndex={phase === 'compose' ? 0 : -1} onClick={send}
            className={`absolute left-0 top-0 flex items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 disabled:hover:bg-transparent ${pillOn ? 'pointer-events-auto' : ''} ${canSubmit ? '' : 'text-text-muted'}`}
            style={{ ...pillStyle, boxShadow: phase === 'compose' && canSubmit ? '0 5px 13px rgba(220,20,60,0.28)' : '0 0 0 rgba(220,20,60,0)' }}>
            <ArrowUpIcon className={`h-5 w-5 transition-opacity duration-150 ${phase === 'compose' ? 'opacity-100' : 'opacity-0'}`} />
          </button>

          <button type="button" aria-label={phase === 'failed' ? '다시 시도' : '생성 중지'} title={phase === 'failed' ? '다시 시도' : '중지'} tabIndex={detached ? 0 : -1}
            onClick={phase === 'failed' ? retryLive : stop}
            className={`absolute left-0 top-0 flex items-center justify-center rounded-full transition-colors hover:bg-black/5 ${detached ? 'pointer-events-auto' : ''} ${phase === 'failed' ? 'text-brand' : 'text-text-primary'}`}
            style={{
              ...box(trackR - STOP, cy - STOP / 2, STOP, STOP), opacity: detached ? 1 : 0,
              transition: tr([['opacity', 220, EASE, phase === 'track' ? T.detach * 0.6 : 0], ['transform', 300]]),
            }}>
            {phase === 'failed' ? <RetryIcon className="h-4 w-4" /> : <StopIcon className="h-3.5 w-3.5" />}
          </button>

          <div aria-live="polite" className="absolute left-0 top-0 flex items-center justify-between gap-3 text-[12px] text-text-secondary"
            style={{
              ...box(trackL, handedOff ? cy - 10 : cy + 10, phase === 'rejoin' || handedOff ? fullW : shortW, 20),
              opacity: lineOn ? 1 : 0,
              transition: tr([['opacity', 300, EASE, phase === 'track' ? 200 : 0], ['width', T.rejoin], ['transform', T.shift]]),
            }}>
            {handedOff
              ? <DoneLine job={job} />
              : lineOn && <StatusLine job={job} phase={phase} />}
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-[11.5px] text-text-muted">MARS v1.0.0은 AI이므로 실수를 할 수 있습니다. 중요한 정보는 재차 확인하십시오.</p>

      {/* 생성 문서: 상태·진행률·작업 액션은 미리보기가 아니라 여기서 보여 준다 (v3 상태 표시).
          진행 줄에서 끝난 작업은 맨 위에 새 줄로 내려앉는다 */}
      <section aria-label="생성 문서" className="mt-10">
        <h2 className="mb-2 px-1 text-[13px] font-semibold text-text-muted">생성 문서 {listJobs.length}</h2>
        {listJobs.length === 0 && (
          <p className="rounded-xl border border-dashed border-surface-border px-4 py-6 text-center text-[12.5px] text-text-muted">
            생성된 문서가 여기에 표시됩니다.
          </p>
        )}
        <ul className="flex flex-col gap-0.5">
          {listJobs.map((item) => {
            // 넓은 화면: 오른쪽 미리보기에 떠 있는 줄 / 좁은 화면: 아래로 펼친 줄
            const previewing = viewed ? viewId : side && settled ? liveId : null
            const on = vp.wide ? side && previewing === item.job_id : viewId === item.job_id
            const justDone = item.job_id === liveId && settled
            return (
              <li key={item.job_id} className={isFresh(item.job_id) ? 'animate-docgen-row-in rounded-xl' : ''}>
                <div aria-pressed={on} {...selectable(() => view(item.job_id))}
                  className={`group cursor-pointer rounded-xl px-3 py-2.5 transition-colors ${on ? 'bg-brand-subtle' : 'hover:bg-surface-card1'}`}>
                  <div className="flex items-center gap-2">
                    <StatusDot job={item} />
                    <span className={`min-w-0 flex-1 truncate text-[13.5px] font-semibold ${on ? 'text-brand' : 'text-text-primary'}`}>{item.title}</span>
                    {justDone && <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[10.5px] font-bold text-white">방금</span>}
                    <span className="shrink-0 text-[11.5px] text-text-muted">{item.template_name} · {item.output_format}</span>
                  </div>
                  {normalizeJobStatus(item.status) === 'running' && <ProgressBar value={item.progress} className="ml-4 mt-2" />}
                  <div className="mt-1 flex min-h-8 items-center justify-between gap-2 pl-4 text-[11.5px] text-text-muted">
                    <JobProgressText job={item} />
                    <span onClick={(e) => e.stopPropagation()} className={on ? '' : 'lg:opacity-0 lg:group-hover:opacity-100'}><JobActions job={item} /></span>
                  </div>
                </div>
                {!vp.wide && on && (
                  <div className="mt-2 overflow-hidden rounded-[20px] border border-surface-border bg-surface">
                    <PreviewCard job={item} open animate={false} />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <p className="mt-6 text-center text-[11.5px] text-text-hint">
        <span className="text-text-muted">시안 메모 · 결과(완료·실패·취소)는 무작위입니다. 프롬프트에 ‘실패’·‘취소’를 넣으면 그 흐름으로 고정됩니다.</span>
      </p>
      </div>

      {/* 오른쪽 미리보기 열 (넓은 화면). 열이 자라는 동안 막대가 날아와 내려앉고, 그 자리에서 펼쳐진다 */}
      <aside ref={asideRef} aria-label="미리보기" aria-hidden={!panelOn} inert={!panelOn} className="relative min-w-0 max-lg:hidden"
        style={{ opacity: side ? 1 : 0, transform: side ? 'none' : 'translateX(32px)', transition: tr([['opacity', 400], ['transform', T.shift]]) }}>
        <div ref={panelBoxRef} className="sticky top-6">
          <div className="overflow-hidden" style={panelStyle}>
            <div className="custom-scroll h-full overflow-y-auto">
              {vp.wide && (
                <PreviewCard key={panelJob?.job_id} job={panelJob} open={viewed ? true : phase === 'done'} animate={!viewed && animate}
                  onClose={() => setSideOpen(false)} />
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* 왼쪽 진행 줄 → 오른쪽 열로 옮겨 가는 막대. 위치는 shift()가 매 프레임 직접 정한다 */}
      <div ref={flyRef} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 rounded-full bg-brand max-lg:hidden"
        style={{ height: BAR, opacity: phase === 'shift' ? 1 : 0 }} />
    </div>
  )
}

export default function DraftV6() {
  useFreshDraft()
  return (
    <div className="flex h-full flex-col">
      <DraftBar current="v6" />
      <div className="custom-scroll min-h-0 flex-1 overflow-y-auto">
        <Stage />
      </div>
    </div>
  )
}
