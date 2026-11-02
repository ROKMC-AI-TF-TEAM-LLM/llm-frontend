// TEMP(시안 비교용) v10·v11 공용 화면: v7 전송 모션 위에 엠블럼 조각을 얹는다. 시안이 정해지면 drafts 폴더째 삭제
//   eagle (v10 B안)      → 진행 막대 머리를 독수리가 끌고 가고, 머리 위에 진행률 꼬리표가 따라간다. 막대 끝에 별
//                          독수리가 별에 닿으면 완료
//   ropeEagle (v11 A+B안) → 막대가 꼬인 로프 무늬가 되어 흘러가고, 그 위를 독수리가 난다.
//                          떨어져 나온 중지 버튼 둘레에 로프 고리가 돌아 '아직 일하는 중'을 알린다
//                          (독수리 = 얼마나 왔는지, 고리 = 멈추지 않았는지. 진행률이 잠시 멈춰도 고리는 돈다)
// 흐름(전송 → 선 긋기 → 막대 → 끝이 떨어져 중지 버튼 → 완료되면 막대가 미리보기로 펼쳐짐)은 v7 그대로다.
// 서버는 상태와 진행률만 준다고 보고, 남은 시간은 지금까지의 속도로 어림한다.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import type { DocGenJob } from '../../../types/docgen'
import { normalizeJobStatus } from '../../../utils/docgen'
import { useCancelDocGenJob, useDocGenJobs, useRetryDocGenJob } from '../../../hooks/useDocGen'
import { showToast } from '../../../api/store/toastStore'
import { useComposer, useFreshIds } from '../../../features/docgen/hooks'
import { ArrowUpIcon, RetryIcon, StopIcon } from '../../../features/docgen/icons'
import { ComposerOptions } from '../../../features/docgen/components'
import {
  EASE, EASE_DRAW, ROPE_TEXTURE, ROPE_TEXTURE_TRACK, SPRING, box, easeInOut, easeOut, prefersReducedMotion, rise, useTimers, useTween, useViewport,
} from './emblemHooks'
import { DoneLine, EagleMark, JobList, PreviewCard, RopeRing, StarMark, StatusLine } from './emblemParts'
import './DraftV7.css'
import './emblemDrafts.css'

export type BarVariant = 'eagle' | 'ropeEagle'

type Phase = 'compose' | 'drop' | 'draw' | 'merge' | 'track' | 'rejoin' | 'shift' | 'land' | 'done' | 'failed' | 'closing'

/** 단계별 움직임 시간(ms) — v7과 같다 */
const T = { drop: 520, draw: 820, merge: 460, hold: 200, detach: 700, rejoin: 560, shift: 780, open: 900, close: 420 }

const SEND = 40 // 전송 버튼 지름
const STOP = 36 // 떨어져 나온 버튼 지름
const BAR = 6 // 막대 두께
const GAP = 12 // 막대와 떨어진 버튼 사이
const LANE_H = 86 // 진행 줄 높이 (막대 위로 독수리와 꼬리표가 올라설 자리를 둔다)
const DONE_H = 60 // 미리보기가 옆으로 간 뒤 남는 완료 줄 높이
const BAR_Y = 46 // 진행 줄 안에서 막대 중심
const EAGLE_W = 46 // 막대 위 독수리 너비 (도안 비율 2.18:1)
const EAGLE_H = 21
const STAR = 16
const RING = 52 // 중지 버튼 둘레 로프 고리 지름

const TRACK_COLOR = 'var(--color-surface-border)'

interface Geo { slotX: number; slotY: number; laneTop: number; width: number; cardH: number }

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

export default function EmblemBarStage({ variant }: { variant: BarVariant }) {
  const rope = variant === 'ropeEagle'
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
  // 전송 버튼을 누르고 있는 동안 모양과 아이콘이 함께 살짝 눌린다
  const [pressed, setPressed] = useState(false)
  const { later, frame, clear } = useTimers()
  const pct = useTween(job?.progress ?? 0)

  const { geo, ready, wrapRef, composerRef, slotRef, laneRef, cardRef } = useGeometry()
  const pageRef = useRef<HTMLDivElement>(null)
  const asideRef = useRef<HTMLElement>(null)
  const panelBoxRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const flyRef = useRef<HTMLDivElement>(null)

  // 배치가 상태를 따라간다: 미리보기가 열리면 두 열, 닫히면 가운데 한 열
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

  /** 다 만들어짐: 독수리가 끝에 닿고 중지 버튼이 다시 붙은 뒤 → 막대가 미리보기로 펼쳐진다 */
  const finish = () => {
    setPhase('rejoin')
    later(T.rejoin, () => setViewId(null))
    // 독수리가 끝에 내려앉는 모습을 잠깐 보여 준다
    later(T.rejoin + 380, () => {
      if (wideRef.current) return shift()
      setPhase('done')
      later(T.open * 0.5, () => cardRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' }))
    })
  }

  // 진행 줄은 서버 작업 상태를 따라간다. 완료는 진행률이 아니라 상태값(완료)으로만 판단한다
  useEffect(() => {
    if (awaiting) return
    if (phase === 'track' && liveState === 'completed') later(0, finish)
    else if (phase === 'track' && liveState === 'failed') later(0, () => setPhase('failed'))
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
  const handedOff = vp.wide && (phase === 'shift' || phase === 'land' || isDone)
  const sheet = !vp.wide && isDone
  const cancelled = job?.error?.code === 'CANCELLED'
  const queued = phase === 'track' && liveState === 'queued'
  const running = phase === 'track' && liveState === 'running'

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
  const squash = pressed && phase === 'compose'
  const squashTransition = `scale ${squash ? 120 : 420}ms ${squash ? EASE : SPRING}`
  const shapeStyle: CSSProperties = {
    ...pillStyle, scale: squash ? 0.9 : 1,
    transition: animate ? `${pillStyle.transition}, ${squashTransition}` : pillStyle.transition,
  }

  // 선(=막대 바탕) — 버튼을 따라 오른쪽에서 왼쪽으로 그려지고, 끝이 떨어지면 짧아진다
  const drawn = !(phase === 'compose' || phase === 'drop')
  const trackStyle: CSSProperties = {
    transform: `translate(${trackL}px, ${barTop}px) scaleX(${drawn ? 1 : 0})`,
    transformOrigin: 'right center',
    width: detached ? shortW : fullW,
    height: BAR,
    backgroundColor: phase === 'drop' || phase === 'draw' ? 'var(--color-brand)' : TRACK_COLOR,
    backgroundImage: rope ? ROPE_TEXTURE_TRACK : undefined,
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
  const fillColor = phase === 'failed' ? (cancelled ? 'var(--color-text-muted)' : 'var(--color-status-error)') : 'var(--color-brand)'
  const fillStyle: CSSProperties = sheet
    ? {
      ...box(0, g.laneTop, g.width, g.cardH), borderRadius: 20, opacity: phase === 'closing' ? 0 : 1,
      backgroundColor: 'var(--color-brand-subtle)', boxShadow: 'inset 0 0 0 1px var(--color-brand-soft)',
      transition: tr([['transform', T.open], ['width', T.open], ['height', T.open], ['border-radius', T.open], ['background-color', T.open], ['box-shadow', T.open], ['opacity', T.close]]),
    }
    : {
      ...box(trackL, barTop, fillW, BAR), borderRadius: BAR / 2, opacity: fillOn ? 1 : 0,
      backgroundColor: fillColor,
      backgroundImage: rope ? ROPE_TEXTURE : undefined,
      boxShadow: 'inset 0 0 0 1px transparent',
      transition: tr([['transform', 300], ['width', phase === 'rejoin' ? T.rejoin : 500], ['background-color', 300], ['opacity', 0]]),
    }

  // 독수리 — 채움의 머리에 앉아 함께 간다. 완료 막대를 넘겨주거나 결과 칸으로 펼쳐지면 사라진다
  const eagleOn = (detached || phase === 'rejoin') && !handedOff && !sheet
  const headX = trackL + fillW
  const eagleX = Math.max(trackL - 4, Math.min(headX - EAGLE_W * 0.62, trackL + fullW - EAGLE_W))
  const eagleLive = running || phase === 'rejoin'
  const eagleStyle: CSSProperties = {
    ...box(eagleX, barTop - EAGLE_H - 21, EAGLE_W, EAGLE_H + 20),
    opacity: eagleOn ? 1 : 0,
    color: eagleLive ? 'var(--color-brand)' : 'var(--color-text-muted)',
    transition: tr([['transform', phase === 'rejoin' ? T.rejoin : 500], ['opacity', 250, EASE, phase === 'track' ? T.detach * 0.4 : 0], ['color', 300]]),
  }
  const showTag = eagleOn && !queued

  // 별 — 막대 끝(B안). 독수리가 닿으면 빨갛게 바뀐다
  const starOn = !rope && (detached || phase === 'rejoin') && !handedOff && !sheet
  const starX = trackL + (phase === 'rejoin' ? fullW : shortW) - STAR / 2
  const starStyle: CSSProperties = {
    ...box(starX, cy - STAR / 2, STAR, STAR),
    opacity: starOn ? 1 : 0,
    color: phase === 'rejoin' ? 'var(--color-brand)' : 'var(--color-text-muted)',
    scale: phase === 'rejoin' ? 1.25 : 1,
    transition: tr([['transform', phase === 'rejoin' ? T.rejoin : T.detach], ['opacity', 250], ['color', 300, EASE, phase === 'rejoin' ? T.rejoin * 0.7 : 0], ['scale', 520, SPRING, phase === 'rejoin' ? T.rejoin * 0.7 : 0]]),
  }

  // 로프 고리(A+B안) — 중지 버튼 둘레를 돈다
  const ringOn = rope && detached
  const ringColor = phase === 'failed' ? (cancelled ? 'var(--color-text-muted)' : 'var(--color-status-error)') : queued ? 'var(--color-text-muted)' : 'var(--color-brand)'

  // 오른쪽 미리보기 패널 — 내려앉은 막대(land)에서 위아래로 펼쳐진다. 목록에서 고른 작업이면 바로 보인다
  const panelJob = viewed ?? job
  const panelOn = side && (viewed ? phase !== 'shift' && phase !== 'land' && phase !== 'closing' : phase === 'land' || phase === 'done')
  const panelH = Math.max(320, vp.h - 150)
  const panelStyle: CSSProperties = phase === 'land'
    ? { transform: `translateY(${panelFrom}px)`, height: BAR, borderRadius: BAR / 2, backgroundColor: 'var(--color-brand)', boxShadow: '0 0 0 1px transparent', transition: 'none' }
    : {
      transform: 'none', height: panelH, borderRadius: 20, opacity: panelOn ? 1 : 0,
      backgroundColor: 'var(--color-surface)', boxShadow: '0 0 0 1px var(--color-surface-border), 0 30px 60px -18px rgba(0,0,0,0.14)',
      transition: tr([['transform', T.open], ['height', T.open], ['border-radius', T.open], ['background-color', T.open * 0.6], ['box-shadow', T.open], ['opacity', T.close]]),
    }

  const laneH = phase === 'compose' || phase === 'closing' ? 0 : sheet ? g.cardH : handedOff ? DONE_H : LANE_H
  const lineOn = detached || phase === 'rejoin' || (handedOff && phase !== 'closing')
  const showResend = phase === 'done' || phase === 'failed' || phase === 'closing'
  const sendClass = canSubmit
    ? 'bg-gradient-to-br from-brand to-brand-light text-white'
    : 'bg-surface-subtle text-text-muted'

  const previewing = viewed ? viewId : side && settled ? liveId : null
  const listSelected = vp.wide ? (side ? previewing : null) : viewId

  return (
    <div ref={pageRef} className="relative mx-auto w-full max-w-[1360px] px-4 pb-24 pt-[14vh] sm:px-6 lg:grid"
      style={{ gridTemplateColumns: side ? 'minmax(0,0.9fr) minmax(0,1.1fr)' : 'minmax(0,1fr) minmax(0,0fr)', columnGap: side ? 40 : 0, transition: tr([['grid-template-columns', T.shift], ['column-gap', T.shift]]) }}>
      {/* 막대 끝이 떨어져 나갈 때 액체처럼 늘어났다 끊기게 하는 필터 */}
      <svg aria-hidden="true" className="absolute h-0 w-0">
        <filter id={`emb-goo-${variant}`}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </svg>

      <div className="mx-auto w-full min-w-0 max-w-[720px]">
      <div {...rise(0)}>
        <h1 className="text-center text-[24px] font-bold text-text-primary sm:text-[28px]">
          어떤 <span className="text-brand">문서</span>를 만들까요?
        </h1>
        <p className="mt-2 text-center text-[13.5px] text-text-secondary">요청을 적고 양식을 고르면 그 양식에 맞춰 초안을 써 드립니다.</p>
      </div>

      <div ref={wrapRef} className={`relative z-10 mt-9 ${rise(120).className}`} style={rise(120).style}>
        <section ref={composerRef} aria-label="문서 요청"
          className={`rounded-[28px] border bg-surface shadow-[0_12px_30px_rgba(220,20,60,0.05)] transition-[border-color,box-shadow] duration-500 focus-within:shadow-[0_18px_44px_rgba(220,20,60,0.09)] ${editable ? 'border-brand-soft focus-within:border-brand' : 'border-surface-border'}`}>
          <label htmlFor={`emb-prompt-${variant}`} className="sr-only">프롬프트</label>
          <textarea id={`emb-prompt-${variant}`} value={c.prompt} onChange={(e) => c.setPrompt(e.target.value)} readOnly={!editable} rows={3}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() } }}
            placeholder="만들 문서를 설명해 주세요."
            className={`w-full resize-none bg-transparent px-5 pt-5 text-[15px] leading-relaxed outline-none placeholder:text-text-muted sm:px-6 ${editable ? 'text-text-primary' : 'text-text-secondary'}`} />
          <div className="flex flex-wrap items-center gap-1 px-3 pb-3 pt-2">
            <ComposerOptions c={c} disabled={!editable} withTemplate />
            <span className="flex-1" />
            {/* 전송 자리. 처음에는 위 겹의 움직이는 버튼이 여기 앉고, 결과·실패 뒤에는 새 버튼이 돋아난다 */}
            <div ref={slotRef} className="h-10 w-10 shrink-0">
              <button type="button" aria-label="다시 생성 요청" tabIndex={showResend ? 0 : -1} disabled={!canSubmit || phase === 'closing'} onClick={send}
                className={`flex h-10 w-10 items-center justify-center rounded-full ${sendClass} ${showResend ? 'opacity-100' : 'pointer-events-none opacity-0'} ${canSubmit ? 'shadow-[0_5px_13px_rgba(220,20,60,0.28)]' : ''}`}
                style={{
                  scale: showResend ? 1 : 0.5,
                  transition: showResend && animate ? `opacity 300ms ${EASE} 200ms, scale 520ms ${SPRING} 200ms` : 'none',
                }}>
                <ArrowUpIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>

        {/* 진행 줄: 높이만 차지하고, 그림은 위 겹에서 그린다 */}
        <div ref={laneRef} style={{ height: laneH, transition: tr([['height', phase === 'closing' ? T.close : sheet ? T.open : T.drop]]) }} />

        <div className="pointer-events-none absolute inset-0" style={{ visibility: geo ? 'visible' : 'hidden' }}>
          {/* 모양 겹 (goo 필터) */}
          <div className="absolute inset-0" style={{ filter: `url(#emb-goo-${variant})` }}>
            <span className={`absolute left-0 top-0 rounded-full ${phase === 'compose' ? sendClass : 'bg-gradient-to-br from-brand to-brand-light'}`} style={shapeStyle} />
            <span className="absolute left-0 top-0 rounded-full" style={trackStyle} />
            <span className="absolute left-0 top-0 rounded-full" style={blobStyle} />
          </div>

          {/* 막대 끝 별 (B안) */}
          <span className="absolute left-0 top-0" style={starStyle}><StarMark className="h-full w-full" /></span>

          {/* 진행 채움 → 결과 칸 */}
          <div ref={fillRef} className={`absolute left-0 top-0 overflow-hidden ${sheet && phase === 'done' ? 'pointer-events-auto' : ''} ${rope && running && !sheet ? 'emb-rope-pull' : ''}`} style={fillStyle}>
            {!rope && running && !reduce && <span aria-hidden="true" className="v7-shimmer" />}
            <div ref={cardRef} inert={!(sheet && phase === 'done')} style={{ width: g.width }}>
              {!vp.wide && <PreviewCard key={job?.job_id} job={job} open={phase === 'done'} animate={animate} />}
            </div>
          </div>

          {/* 독수리와 진행률 꼬리표 — 채움 머리를 따라간다 */}
          <div aria-hidden="true" className="absolute left-0 top-0" style={eagleStyle}>
            <div className="flex h-full flex-col items-center justify-end">
              <span className="mb-0.5 whitespace-nowrap rounded-full bg-brand px-1.5 py-px text-[10.5px] font-bold leading-[16px] text-white tabular-nums transition-opacity duration-300"
                style={{ opacity: showTag ? 1 : 0, backgroundColor: phase === 'failed' ? (cancelled ? 'var(--color-text-secondary)' : 'var(--color-status-error)') : undefined }}>
                {phase === 'rejoin' ? 100 : pct}%
              </span>
              <span className={eagleLive && !reduce ? 'emb-glide' : ''} style={{ width: EAGLE_W, height: EAGLE_H, display: 'block' }}>
                <EagleMark className="h-full w-full" />
              </span>
            </div>
          </div>

          {/* 누르는 겹 (필터 없이 아이콘·글자) */}
          <button type="button" aria-label="생성 요청" disabled={!canSubmit || phase !== 'compose'} tabIndex={phase === 'compose' ? 0 : -1} onClick={send}
            onPointerDown={() => { if (canSubmit) setPressed(true) }} onPointerUp={() => setPressed(false)} onPointerLeave={() => setPressed(false)} onPointerCancel={() => setPressed(false)}
            className={`absolute left-0 top-0 flex items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 disabled:hover:bg-transparent ${pillOn ? 'pointer-events-auto' : ''} ${canSubmit ? '' : 'text-text-muted'}`}
            style={{ ...pillStyle, boxShadow: phase === 'compose' && canSubmit ? '0 5px 13px rgba(220,20,60,0.28)' : '0 0 0 rgba(220,20,60,0)' }}>
            <span className="flex" style={{ scale: squash ? 0.9 : 1, transition: animate ? squashTransition : 'none' }}>
              <ArrowUpIcon className={`h-5 w-5 transition-opacity duration-150 ${phase === 'compose' ? 'opacity-100' : 'opacity-0'}`} />
            </span>
          </button>

          {/* 로프 고리 (A+B안) — 버튼 뒤에 깔린다 */}
          <span className="absolute left-0 top-0" style={{
            ...box(trackR - STOP / 2 - RING / 2, cy - RING / 2, RING, RING), opacity: ringOn ? 1 : 0, scale: ringOn ? 1 : 0.7,
            transition: tr([['opacity', 260, EASE, phase === 'track' ? T.detach * 0.6 : 0], ['scale', 520, SPRING, phase === 'track' ? T.detach * 0.5 : 0]]),
          }}>
            <RopeRing size={RING} stroke={4} value={phase === 'failed' ? 100 : undefined} spin={phase === 'failed' ? null : queued ? 'slow' : 'fast'} color={ringColor} />
          </span>

          <button type="button" aria-label={phase === 'failed' ? '다시 시도' : '생성 중지'} title={phase === 'failed' ? '다시 시도' : '중지'} tabIndex={detached ? 0 : -1}
            onClick={phase === 'failed' ? retryLive : stop}
            className={`absolute left-0 top-0 flex items-center justify-center rounded-full transition-colors hover:bg-black/5 ${detached ? 'pointer-events-auto' : ''} ${phase === 'failed' ? 'text-brand' : 'text-text-primary'}`}
            style={{
              ...box(trackR - STOP, cy - STOP / 2, STOP, STOP), opacity: detached ? 1 : 0, scale: detached ? 1 : 0.6,
              transition: tr([['opacity', 220, EASE, phase === 'track' ? T.detach * 0.6 : 0], ['scale', 520, SPRING, phase === 'track' ? T.detach * 0.5 : 0], ['transform', 300]]),
            }}>
            {phase === 'failed' ? <RetryIcon className="h-4 w-4" /> : <StopIcon className="h-3.5 w-3.5" />}
          </button>

          <div aria-live="polite" className="absolute left-0 top-0 flex items-center justify-between gap-3 text-[12px] text-text-secondary"
            style={{
              ...box(trackL, handedOff ? g.laneTop + 20 : cy + 12, phase === 'rejoin' || handedOff ? fullW : shortW, 20),
              opacity: lineOn ? 1 : 0,
              transition: tr([['opacity', 300, EASE, phase === 'track' ? 200 : 0], ['width', T.rejoin], ['transform', T.shift]]),
            }}>
            {handedOff
              ? <DoneLine job={job} />
              : lineOn && <StatusLine job={job} finishing={phase === 'rejoin'} />}
          </div>
        </div>
      </div>

      <p className={`mt-4 text-center text-[11.5px] text-text-muted ${rise(200).className}`} style={rise(200).style}>MARS v1.0.0은 AI이므로 실수를 할 수 있습니다. 중요한 정보는 재차 확인하십시오.</p>

      <section aria-label="생성 문서" className={`mt-16 ${rise(280).className}`} style={rise(280).style}>
        <JobList jobs={listJobs} isFresh={isFresh} selectedId={listSelected} justDoneId={settled ? liveId : null} wide={vp.wide} onView={view} />
      </section>

      <p className="mt-10 text-center text-[11.5px] text-text-hint">
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
        style={{ height: BAR, opacity: phase === 'shift' ? 1 : 0, backgroundImage: rope ? ROPE_TEXTURE : undefined }} />
    </div>
  )
}
