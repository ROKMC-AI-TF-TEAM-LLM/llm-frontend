// TEMP(시안 비교용) v13 스테이지 (디자인 G안): 문서 축소판이 가운데로 미끄러져 온다
//   첫 화면   → 가운데 제목·입력창. 만든 문서는 오른쪽 줄에 비스듬한 축소판으로 쌓인다
//   전송      → 입력창 끝에서 작은 문서가 튀어나와 오른쪽 줄 맨 위 자리로 날아간다
//   생성 중   → 축소판의 줄이 진행률만큼 채워지고, 모서리 고리와 아래 설명이 진행률·남은 시간을 보여 준다
//   열기      → 축소판을 누르면 물리 스프링으로 가운데까지 커지고, 뒤 화면은 흐려진다
//   완료      → 방금 완성된 문서에는 빛이 한 번 스친다
// 진행은 서버(목) 작업 상태를 그대로 따른다. 결과는 무작위이고, 프롬프트에 '실패'·'취소'를 넣으면 고정된다.
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import type { DocGenJob } from '../../../types/docgen'
import { formatBytes, formatClock, formatEta, getJobErrorMessage, normalizeJobStatus } from '../../../utils/docgen'
import { useDocGenJobs, useCancelDocGenJob, useDeleteDocGenJob, useRetryDocGenJob } from '../../../hooks/useDocGen'
import { showToast } from '../../../api/store/toastStore'
import { useComposer, useFreshIds } from '../../../features/docgen/hooks'
import { ArrowUpIcon, DocIcon, DownloadIcon, RetryIcon, StopIcon, XIcon } from '../../../features/docgen/icons'
import { ComposerOptions, Spinner } from '../../../features/docgen/components'
import DraftBar from './DraftBar'
import { useFreshDraft } from './draftState'
import './DraftV13.css'

/** 오른쪽 줄에 놓는 문서 수 */
const MAX_SLOTS = 5
/** 펼친 문서 카드 크기 (축소판은 이 카드를 줄여 그린다) */
const CARD_W = 600
const CARD_H = 760
/** 이보다 좁으면 축소판 줄을 아래쪽 가로줄로 옮긴다 */
const COMPACT_W = 900

/* ───────── 물리 스프링 ───────── */
// 응답 시간과 감쇠로 움직임을 정한다. 움직이는 중에 목표가 바뀌어도 속도를 이어받아 자연스럽게 방향을 튼다
const RESPONSE = 0.42
const DAMPING = 0.88
const K = (2 * Math.PI / RESPONSE) ** 2
const C = 4 * Math.PI * DAMPING / RESPONSE
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

type Vec = number[]

/**
 * target으로 스프링을 움직이며 매 프레임 apply로 값을 넘긴다.
 * 리렌더 없이 DOM 스타일을 직접 바꾸므로 apply 안에서만 스타일을 쓴다.
 */
function useSpring(target: Vec, apply: (p: Vec) => void, tol: Vec, init?: () => Vec) {
  const state = useRef<{ p: Vec; v: Vec } | null>(null)
  const goal = useRef(target)
  const applyRef = useRef(apply)
  const initRef = useRef(init)
  const frame = useRef(0)
  useLayoutEffect(() => {
    applyRef.current = apply
    initRef.current = init
  })
  const key = target.map((n) => n.toFixed(4)).join()

  useLayoutEffect(() => {
    goal.current = target
    if (!state.current) state.current = { p: (initRef.current?.() ?? target).slice(), v: target.map(() => 0) }
    const s = state.current
    if (reduceMotion()) {
      s.p = target.slice()
      s.v = target.map(() => 0)
    }
    applyRef.current(s.p)
    if (frame.current || reduceMotion()) return
    let last = performance.now()
    const step = (now: number) => {
      const g = goal.current
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
      last = now
      const n = Math.max(1, Math.ceil(dt * 240))
      const h = dt / n
      for (let j = 0; j < n; j++) {
        for (let q = 0; q < g.length; q++) {
          s.v[q] += (-K * (s.p[q] - g[q]) - C * s.v[q]) * h
          s.p[q] += s.v[q] * h
        }
      }
      const moving = g.some((x, q) => Math.abs(s.p[q] - x) > tol[q] || Math.abs(s.v[q]) > tol[q] * 4)
      if (!moving) {
        s.p = g.slice()
        s.v = g.map(() => 0)
      }
      applyRef.current(s.p)
      frame.current = moving ? requestAnimationFrame(step) : 0
    }
    frame.current = requestAnimationFrame(step)
    // target 값은 key로 비교한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => () => {
    cancelAnimationFrame(frame.current)
    frame.current = 0
  }, [])
}

/* ───────── 자리 계산 ───────── */
type Geo = ReturnType<typeof geometry>

/** 무대 크기에 맞춘 펼친 자리와 축소판 자리 */
function geometry(w: number, h: number) {
  const compact = w < COMPACT_W
  const openS = Math.max(0.3, Math.min(1, (h - 40) / CARD_H, (w - 32) / CARD_W))
  const openX = compact ? w / 2 : Math.max((CARD_W / 2) * openS + 16, (w - 200) / 2 + 20)
  const center: Vec = [openX, h / 2, openS, 0]
  if (compact) {
    const gap = Math.min(96, (w - 24) / MAX_SLOTS)
    const s = Math.min(0.13, (gap - 14) / CARD_W)
    return {
      compact, center, restS: s, fit: 1,
      slot: (i: number, hover: boolean): Vec => [w / 2 + (i - (MAX_SLOTS - 1) / 2) * gap, h - 74, hover ? s * 1.08 : s, 0],
    }
  }
  // 세로가 모자라면 줄 간격과 축소판을 함께 줄인다
  const fit = Math.min(1, (h - 20) / 860)
  const s = 0.18 * fit
  return {
    compact, center, restS: s, fit,
    slot: (i: number, hover: boolean): Vec => [w - 110, (110 + i * 160) * fit, hover ? s * 1.083 : s, hover ? 8 : 24],
  }
}

function useStageSize(ref: RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))

/* ───────── 문서 카드 ───────── */
/** 종이 위 줄 모양 (진행률만큼 차오른다) */
const LINES = ['100%', '92%', '64%', '100%', '86%', '40%', '100%', '94%', '72%', '58%', '100%', '80%']
const STRONG = new Set([0, 3, 6, 10])

const pill = 'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-colors disabled:opacity-50'

/** 카드 머리 버튼: 상태별로 바뀐다 */
function CardActions({ job, onRemoved }: { job: DocGenJob; onRemoved: () => void }) {
  const cancel = useCancelDocGenJob()
  const retry = useRetryDocGenJob()
  const remove = useDeleteDocGenJob()
  const busy = cancel.isPending || retry.isPending || remove.isPending
  const onError = { onError: () => showToast('요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.') }
  const s = normalizeJobStatus(job.status)
  if (s === 'queued' || s === 'running')
    return (
      <button type="button" disabled={busy} onClick={() => cancel.mutate(job.job_id, onError)} className={`${pill} border border-surface-border text-text-primary hover:bg-surface-subtle`}>
        {s === 'running' && <StopIcon className="h-3.5 w-3.5" />} {s === 'queued' ? '취소' : '중지'}
      </button>
    )
  if (s === 'completed')
    // TODO(백엔드 연결): 결과 파일 다운로드 엔드포인트가 정해지면 연결한다
    return (
      <button type="button" aria-label={`${job.result?.file_name ?? job.title} 다운로드`} className={`${pill} bg-brand text-white hover:bg-brand-hover`}>
        <DownloadIcon className="h-4 w-4" /> 다운로드
      </button>
    )
  return (
    <>
      <button type="button" disabled={busy} onClick={() => retry.mutate(job.job_id, onError)} className={`${pill} border border-surface-border text-text-primary hover:bg-surface-subtle`}>
        <RetryIcon className="h-3.5 w-3.5" /> 다시 생성
      </button>
      <button type="button" disabled={busy} onClick={() => remove.mutate(job.job_id, { ...onError, onSuccess: onRemoved })}
        className={`${pill} px-3 text-text-secondary hover:text-status-error`}>
        삭제
      </button>
    </>
  )
}

function cardMeta(job: DocGenJob) {
  const s = normalizeJobStatus(job.status)
  if (s === 'completed') {
    const r = job.result
    return r ? `${job.template_name} · ${job.output_format} · ${formatBytes(r.size)} · ${r.page_count}쪽` : `${job.template_name} · ${job.output_format}`
  }
  if (s === 'running') return `생성 중 ${job.progress}% · 남은 시간 ${formatEta(job.eta_seconds)}`
  if (s === 'queued') return `대기 중 · 앞에 ${job.queue_position ?? 0}건`
  if (job.error?.code === 'CANCELLED') return `${job.progress}%에서 취소됨`
  return getJobErrorMessage(job.error?.code).split('.')[0]
}

/** 종이: 완료되면 미리보기 본문을, 그 전에는 진행률만큼 차오르는 줄을 그린다 */
function CardPaper({ job }: { job: DocGenJob }) {
  const s = normalizeJobStatus(job.status)
  const r = s === 'completed' ? job.result : null
  const filled = Math.round((s === 'completed' ? 1 : job.progress / 100) * LINES.length)
  return (
    <div className="h-full overflow-hidden rounded-md border border-surface-border bg-surface px-12 py-[46px]">
      <p className={`mb-1.5 text-center text-[20px] font-bold tracking-[-0.02em] transition-colors duration-300 ${r || job.progress > 15 ? 'text-text-primary' : 'text-text-hint'}`}>{job.title}</p>
      <p className="mb-[30px] text-center text-[12px] text-text-muted">{job.template_name} · {r ? formatClock(job.finished_at) : '[작성일]'}</p>
      {r ? (
        <div className="space-y-5">
          {r.preview.map((sec) => (
            <section key={sec.heading}>
              <h4 className="text-[14px] font-bold text-text-primary">{sec.heading}</h4>
              <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-text-secondary">{sec.body}</p>
            </section>
          ))}
        </div>
      ) : (
        LINES.map((w, j) => {
          const strong = STRONG.has(j)
          const bg = j < filled ? (strong ? 'bg-[#D6D3CF]' : 'bg-surface-border') : 'bg-[#F6F5F3]'
          return <span key={j} className={`block rounded-[3px] transition-colors duration-300 ${bg} ${strong ? 'h-[11px]' : 'h-2'} ${j === 0 ? '' : strong ? 'mt-[26px]' : 'mt-[11px]'}`} style={{ width: w }} />
        })
      )}
    </div>
  )
}

const RING_C = 2 * Math.PI * 32

function StageCard({ job, target, geo, open, fresh, spawn, onClose }: {
  job: DocGenJob; target: Vec; geo: Geo; open: boolean; fresh: boolean; spawn?: () => Vec; onClose: () => void
}) {
  const ref = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const s = normalizeJobStatus(job.status)
  const failed = s === 'failed'

  useSpring(target, ([x, y, sc, rot]) => {
    const el = ref.current
    if (!el) return
    const k = Math.max(0.02, sc)
    const lift = clamp((k - geo.restS) / Math.max(0.01, geo.center[2] - geo.restS), 0, 1)
    const travelling = Math.abs(k - geo.restS) > 0.03 && !open
    el.style.transform = `translate(${(x - CARD_W / 2).toFixed(2)}px,${(y - CARD_H / 2).toFixed(2)}px) perspective(1400px) rotateY(${rot.toFixed(2)}deg) scale(${k.toFixed(4)})`
    el.style.borderRadius = `${((6 + 10 * lift) / k).toFixed(1)}px`
    el.style.boxShadow = `0 0 0 ${(1 / k).toFixed(2)}px var(--color-surface-border), 0 ${(24 + 20 * lift).toFixed(0)}px ${(60 + 40 * lift).toFixed(0)}px rgba(0,0,0,${(0.2 - 0.07 * lift).toFixed(3)})`
    el.style.zIndex = open || travelling ? '5' : '2'
    el.style.setProperty('--lift', lift.toFixed(3))
  }, [0.3, 0.3, 0.0006, 0.05], spawn)

  // 펼치면 닫기 버튼으로 초점을 옮긴다
  useEffect(() => {
    if (open) closeRef.current?.focus({ preventScroll: true })
  }, [open])

  return (
    <article ref={ref} aria-label={job.title} aria-hidden={!open} inert={!open}
      className={`absolute left-0 top-0 overflow-hidden bg-surface ${open ? '' : 'pointer-events-none'}`}
      style={{ width: CARD_W, height: CARD_H, filter: failed && !open ? 'grayscale(1) opacity(0.65)' : 'none' }}>
      <div className="flex h-[72px] items-center gap-3 border-b border-surface-border pl-5 pr-3.5">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-white ${s === 'completed' ? 'bg-brand' : 'bg-[#D6D3CF]'}`}>
          <DocIcon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-text-primary">{job.result?.file_name ?? `${job.title.replace(/\s+/g, '_')}.${job.output_format.toLowerCase()}`}</p>
          <p className={`mt-0.5 truncate text-[12px] tabular-nums ${failed && job.error?.code !== 'CANCELLED' ? 'text-status-error' : 'text-text-secondary'}`}>{cardMeta(job)}</p>
        </div>
        <CardActions job={job} onRemoved={onClose} />
        <button ref={closeRef} type="button" aria-label="닫기" onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary">
          <XIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="h-[3px] bg-surface-subtle">
        <div className="h-[3px] bg-brand transition-[width] duration-300 ease-linear" style={{ width: s === 'running' ? `${job.progress}%` : '0%' }} />
      </div>
      <div className="relative h-[685px] bg-surface-card1 px-6 pb-6 pt-[22px]">
        <CardPaper job={job} />
        {/* 축소판에서도 보이는 진행 고리. 펼칠수록 옅어진다 */}
        <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true" className="absolute bottom-11 right-11"
          style={{ opacity: s === 'running' || s === 'queued' ? 'calc(1 - var(--lift, 0))' : 0 }}>
          <circle cx="42" cy="42" r="32" fill="#FFFFFF" stroke="var(--color-surface-subtle)" strokeWidth="9" />
          <circle cx="42" cy="42" r="32" fill="none" stroke="var(--color-brand)" strokeWidth="9" strokeLinecap="round"
            strokeDasharray={`${((RING_C * job.progress) / 100).toFixed(1)} ${RING_C.toFixed(1)}`} transform="rotate(-90 42 42)"
            className="transition-[stroke-dasharray] duration-300" />
        </svg>
      </div>
      {fresh && s === 'completed' && (
        <div aria-hidden="true" className="stage-sheen pointer-events-none absolute -top-[10%] left-0 h-[120%] w-[30%] bg-gradient-to-r from-white/0 via-white/85 to-white/0" />
      )}
    </article>
  )
}

/** 축소판 아래 설명: 제목과 상태 */
function Caption({ job, fresh }: { job: DocGenJob; fresh: boolean }) {
  const s = normalizeJobStatus(job.status)
  let meta = formatClock(job.finished_at ?? job.created_at)
  let tone = 'text-text-muted'
  if (s === 'running') {
    meta = `${job.progress}%${job.eta_seconds ? ` · 약 ${formatEta(job.eta_seconds)}` : ''}`
    tone = 'text-text-secondary'
  } else if (s === 'queued') {
    meta = `대기 · 앞에 ${job.queue_position ?? 0}건`
    tone = 'text-text-secondary'
  } else if (s === 'failed') {
    meta = job.error?.code === 'CANCELLED' ? '취소' : '실패'
    tone = job.error?.code === 'CANCELLED' ? 'text-text-muted' : 'text-status-error'
  } else if (fresh) {
    meta = '방금 완료'
    tone = 'text-brand'
  }
  return (
    <>
      <p className={`truncate text-[11.5px] font-semibold ${s === 'failed' ? 'text-text-secondary' : 'text-text-primary'}`}>{job.title}</p>
      <p className={`mt-px text-[11px] tabular-nums ${tone}`}>{meta}</p>
    </>
  )
}

/* ───────── 화면 ───────── */
function Stage() {
  const { jobs, isLoading } = useDocGenJobs()
  const c = useComposer()
  const isFresh = useFreshIds(jobs.map((j) => j.job_id), !isLoading)
  const stageRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLElement>(null)
  const { w, h } = useStageSize(stageRef)
  const [openId, setOpenId] = useState<string | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [seen, setSeen] = useState<Set<string>>(() => new Set())
  const [pending, setPending] = useState(false)

  const docs = jobs.slice(0, MAX_SLOTS)
  const open = docs.some((d) => d.job_id === openId) ? openId : null
  const geo = geometry(w, h)

  // 방금 완성되어 아직 열어 보지 않은 문서
  const isNewDone = (job: DocGenJob) => isFresh(job.job_id) && normalizeJobStatus(job.status) === 'completed' && !seen.has(job.job_id)

  // 뒤 화면: 문서를 펼치면 살짝 작아지며 흐려진다
  useSpring([open ? 1 : 0], ([f]) => {
    const el = bgRef.current
    if (!el) return
    const t = clamp(f, 0, 1)
    el.style.transform = `scale(${(1 - 0.05 * clamp(f, 0, 1.2)).toFixed(4)})`
    el.style.opacity = (1 - 0.72 * t).toFixed(3)
    el.style.filter = t > 0.001 ? `blur(${(3 * t).toFixed(2)}px)` : 'none'
  }, [0.001])

  const pick = (id: string) => {
    if (open === id) return close()
    setOpenId(id)
    setSeen((s) => new Set(s).add(id))
  }

  function close() {
    const id = open
    setOpenId(null)
    if (id) document.getElementById(`stage-slot-${id}`)?.focus({ preventScroll: true })
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  const send = async () => {
    if (!c.canSubmit || pending) return
    setPending(true)
    setOpenId(null)
    const job = await c.submit()
    setPending(false)
    if (job) c.setPrompt('')
  }

  /** 새 문서는 입력창 오른쪽 끝에서 튀어나온다 */
  const spawn = (): Vec => {
    const box = stageRef.current?.getBoundingClientRect()
    const r = composerRef.current?.getBoundingClientRect()
    if (!box || !r) return [w / 2, h / 2, 0.03, 0]
    return [r.right - box.left - 60, r.top - box.top + r.height / 2, 0.03, 0]
  }

  return (
    <div ref={stageRef} className="relative min-h-0 flex-1 overflow-hidden bg-surface">
      {/* 뒤 화면: 제목 · 입력창 */}
      <div ref={bgRef} inert={!!open} className="absolute inset-0 origin-[50%_40%]">
        <div className={`h-full px-4 min-[900px]:px-[200px] ${geo.compact ? 'pb-40' : ''}`}>
        <div className="mx-auto flex h-full w-full max-w-[720px] flex-col pt-[15vh]">
          <h1 className="text-center text-[24px] font-bold tracking-[-0.02em] text-text-primary sm:text-[28px]">
            어떤 <span className="text-brand">문서</span>를 만들까요?
          </h1>
          <p className="mt-2 text-center text-[13.5px] text-text-secondary sm:text-[14px]">요청을 적고 양식을 고르면 그 양식에 맞춰 초안을 써 드립니다.</p>

          <section ref={composerRef} aria-label="문서 요청" className="mt-7 rounded-[28px] border border-brand-soft bg-surface shadow-[0_12px_30px_rgba(220,20,60,0.05)] transition-colors focus-within:border-brand">
            <label htmlFor="v13-prompt" className="sr-only">프롬프트</label>
            <textarea id="v13-prompt" value={c.prompt} onChange={(e) => c.setPrompt(e.target.value)} rows={2}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() } }}
              placeholder="만들 문서를 설명해 주세요."
              className="w-full resize-none bg-transparent px-5 pt-5 text-[15px] leading-relaxed text-text-primary outline-none placeholder:text-text-muted sm:px-6" />
            <div className="flex flex-wrap items-center gap-1 px-3 pb-3 pt-2">
              <ComposerOptions c={c} withTemplate />
              <span className="flex-1" />
              <button type="button" aria-label="생성 요청" disabled={!c.canSubmit || pending} onClick={send}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${c.canSubmit && !pending ? 'bg-gradient-to-br from-brand to-brand-light text-white shadow-[0_5px_13px_rgba(220,20,60,0.28)] hover:brightness-105' : 'bg-surface-subtle text-text-muted'}`}>
                {pending ? <Spinner className="h-4 w-4" /> : <ArrowUpIcon className="h-5 w-5" />}
              </button>
            </div>
          </section>

          <span className="flex-1" />
          <p className="pb-4 pt-6 text-center text-[11.5px] text-text-muted">MARS v1.0.0은 AI이므로 실수를 할 수 있습니다. 중요한 정보는 재차 확인하십시오.</p>
        </div>
        </div>
      </div>

      {/* 펼친 문서 바깥을 누르면 닫는다 */}
      {open && <div aria-hidden="true" onClick={close} className="absolute inset-0 z-[1]" />}

      {w > 0 && (
        <>
          {!geo.compact && docs.length === 0 && (
            <p className="pointer-events-none absolute z-[2] w-[160px] text-center text-[11.5px] leading-relaxed text-text-muted" style={{ left: w - 190, top: 70 * geo.fit }}>
              만든 문서가<br />여기에 쌓입니다
            </p>
          )}

          {!geo.compact && docs.map((job, i) => {
            const [x, y] = geo.slot(i, false)
            return (
              <div key={job.job_id} aria-hidden="true" className={`pointer-events-none absolute z-[2] w-[160px] text-center transition-opacity duration-200 ${open === job.job_id ? 'opacity-0' : 'opacity-100'}`}
                style={{ left: x - 80, top: y + 78 * geo.fit }}>
                <Caption job={job} fresh={isNewDone(job)} />
              </div>
            )
          })}

          {docs.map((job, i) => (
            <StageCard key={job.job_id} job={job} geo={geo} open={open === job.job_id} fresh={isNewDone(job)} onClose={close}
              target={open === job.job_id ? geo.center : geo.slot(i, hoverId === job.job_id)}
              spawn={isFresh(job.job_id) ? spawn : undefined} />
          ))}

          {docs.map((job, i) => {
            const [x, y, s] = geo.slot(i, false)
            const bw = geo.compact ? CARD_W * s + 12 : 136 * geo.fit
            const bh = geo.compact ? CARD_H * s + 12 : 176 * geo.fit
            return (
              <button key={job.job_id} id={`stage-slot-${job.job_id}`} type="button"
                aria-label={`${open === job.job_id ? '닫기' : '열기'}: ${job.title}`} aria-expanded={open === job.job_id}
                onClick={() => pick(job.job_id)}
                onMouseEnter={() => setHoverId(job.job_id)} onMouseLeave={() => setHoverId(null)}
                onFocus={() => setHoverId(job.job_id)} onBlur={() => setHoverId(null)}
                className="absolute z-[3] cursor-pointer rounded-[10px] bg-transparent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text-primary"
                style={{ left: x - bw / 2, top: geo.compact ? y - bh / 2 : y - 70 * geo.fit, width: bw, height: bh }} />
            )
          })}
        </>
      )}
    </div>
  )
}

export default function DraftV13() {
  useFreshDraft()
  return (
    <div className="flex h-full flex-col">
      <DraftBar current="v13" />
      <Stage />
    </div>
  )
}
