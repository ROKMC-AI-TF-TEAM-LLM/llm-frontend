// TEMP(시안 비교용) v6 전송 모션: 대화형 입력창의 전송 버튼이 진행 막대로 바뀐다.
//   전송      → 버튼이 아래로 내려간 뒤 왼쪽으로 선을 그으며 이동하고, 그 선이 진행 막대가 된다
//   생성 중   → 막대 오른쪽 끝이 둥글게 떨어져 나가 중지 버튼이 된다
//   완료      → 중지 버튼이 다시 붙고, 막대가 미리보기가 된다 (v5처럼 배치가 상태를 따라간다)
//               넓은 화면: 입력 열이 왼쪽으로 비켜나고, 막대가 오른쪽 열로 미끄러지며 늘어난 뒤 위아래로 펼쳐진다
//               좁은 화면: 막대가 그 자리에서 아래로 펼쳐진다
//   실패·중지 → 막대가 멈춘 자리에서 색이 바뀌고, 떨어진 버튼은 다시 시도 버튼이 된다
// 미리보기를 닫으면 한 열로 돌아가고, 새로 보내면 미리보기를 접은 뒤 처음부터 재생한다.
// 상단 상태 막대는 각 상태의 정지 화면이고, 입력창에서 직접 보내면 처음부터 움직임이 재생된다.
// 프롬프트에 '실패'를 넣으면 생성 중에 실패한다.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { DocGenJob, DocGenOutputFormat } from '../../../types/docgen'
import {
  LENGTHS, OUTPUT_FORMATS, STAGES, formatBytes, formatClock, formatDuration, formatEta, getJobErrorMessage,
  getStageIndex, normalizeJobStatus, type PageState,
} from '../../../utils/docgen'
import { SCENARIOS, TEMPLATES, type Scenario } from './fixtures'
import { useDraftScenario } from './draftState'
import {
  AlertIcon, ArrowUpIcon, AttachmentChip, CheckIcon, ChevronIcon, ClipIcon, DocIcon, DownloadIcon,
  DraftBar, Paper, RetryIcon, Spinner, StopIcon, XIcon,
} from './shared'

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

/** 목 진행: 대기 2초 → 0.2초마다 2%씩 */
const QUEUE_MS = 2000
const TICK = 200
const STEP = 2

const TRACK_COLOR = 'var(--color-surface-border)'
const PHASE_OF: Record<PageState, Phase> = { idle: 'compose', queued: 'track', running: 'track', completed: 'done', failed: 'failed' }
const LIVE_BASE = SCENARIOS.completed.selected as DocGenJob

interface Geo { slotX: number; slotY: number; laneTop: number; width: number; cardH: number; panelH: number }

/** 넓은 화면이면 미리보기를 오른쪽 열에 띄운다 */
const WIDE = '(min-width: 1024px)'
const readViewport = () => ({ wide: window.matchMedia(WIDE).matches, h: window.innerHeight })
const easeOut = (t: number) => 1 - (1 - t) ** 3
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)

const box = (x: number, y: number, w: number, h: number): CSSProperties => ({ transform: `translate(${x}px, ${y}px)`, width: w, height: h })
const titleOf = (p: string) => {
  const t = p.trim().split('\n')[0]
  return t.length > 22 ? `${t.slice(0, 22)}…` : t
}
const stageAt = (p: number) => (p < 30 ? 'ANALYZING' : p < 80 ? 'DRAFTING' : 'FORMATTING')

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
  const panelRef = useRef<HTMLDivElement>(null)
  const [geo, setGeo] = useState<Geo | null>(null)
  const [ready, setReady] = useState(false)
  useLayoutEffect(() => {
    const [wrap, composer, slot, lane, card, panel] = [wrapRef.current, composerRef.current, slotRef.current, laneRef.current, cardRef.current, panelRef.current]
    if (!wrap || !composer || !slot || !lane || !card || !panel) return
    const measure = () => {
      const w = wrap.getBoundingClientRect()
      const s = slot.getBoundingClientRect()
      const next: Geo = { slotX: s.left - w.left, slotY: s.top - w.top, laneTop: lane.getBoundingClientRect().top - w.top, width: w.width, cardH: card.offsetHeight, panelH: panel.offsetHeight }
      setGeo((prev) => (prev && (Object.keys(next) as (keyof Geo)[]).every((k) => prev[k] === next[k]) ? prev : next))
    }
    measure()
    // 처음 자리를 잡은 뒤에야 움직임을 켠다 (0,0에서 날아오지 않게)
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)))
    const ro = new ResizeObserver(measure)
    ;[wrap, composer, card, panel].forEach((el) => ro.observe(el))
    return () => { ro.disconnect(); cancelAnimationFrame(raf) }
  }, [])
  return { geo, ready, wrapRef, composerRef, slotRef, laneRef, cardRef, panelRef }
}

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ───────── 입력창 선택 칩 ───────── */
interface PickerOption { value: string; label: string; hint?: string }

function Picker({ label, value, options, onChange, disabled, icon }: {
  label: string; value: string | null; options: PickerOption[]; onChange: (v: string) => void; disabled: boolean; icon?: ReactNode
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
          className="absolute left-0 top-full z-20 mt-2 w-[260px] rounded-2xl border border-surface-border bg-surface p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.1)] max-sm:fixed max-sm:inset-x-4 max-sm:bottom-4 max-sm:top-auto max-sm:w-auto">
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

/* ───────── 진행 줄 아래 한 줄 상태 ───────── */
function StatusLine({ job, phase }: { job: DocGenJob | null; phase: Phase }) {
  if (!job) return null
  const s = normalizeJobStatus(job.status)
  if (phase === 'rejoin' || s === 'completed')
    return <><span className="flex items-center gap-1.5 font-semibold text-brand"><CheckIcon className="h-3.5 w-3.5" /> 다 만들었습니다</span><span className="tabular-nums">100%</span></>
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
    return <><span className="flex items-center gap-1.5 font-semibold text-text-primary"><Spinner className="h-3 w-3 text-brand" /> 대기 중 · 앞에 {job.queue_position ?? 0}건</span><span className="shrink-0">예상 {formatEta(job.eta_seconds)}</span></>
  const idx = getStageIndex(job.stage)
  return (
    <>
      <span className="flex min-w-0 items-center gap-1.5 font-semibold text-text-primary"><Spinner className="h-3 w-3 shrink-0 text-brand" /><span className="truncate">{idx}/3 {STAGES[idx - 1].label} 중</span></span>
      <span className="shrink-0 tabular-nums">{job.progress}% · 남은 시간 {formatEta(job.eta_seconds)}</span>
    </>
  )
}

/** 미리보기가 옆 열로 간 뒤 입력창 아래 남는 완료 한 줄 */
function DoneLine({ job, previewOpen, onOpen }: { job: DocGenJob | null; previewOpen: boolean; onOpen: () => void }) {
  const took = job ? formatDuration(job.started_at ?? job.created_at, job.finished_at) : ''
  return (
    <>
      <span className="flex min-w-0 items-center gap-1.5 font-semibold text-brand">
        <CheckIcon className="h-3.5 w-3.5 shrink-0" /> 다 만들었습니다
        {took && <span className="truncate font-normal text-text-muted">· 소요 {took}</span>}
      </span>
      {previewOpen
        ? <span className="shrink-0 text-text-muted">오른쪽에서 미리보고 받을 수 있습니다</span>
        : <button type="button" onClick={onOpen} className="pointer-events-auto shrink-0 font-semibold text-brand hover:underline">미리보기 열기</button>}
    </>
  )
}

/* ───────── 막대가 펼쳐져 된 결과 칸 ───────── */
type PreviewTab = 'doc' | 'files' | 'request'

/** 펼쳐진 칸 안의 한 덩어리가 차례로 떠오르게 한다 */
const reveal = (open: boolean, animate: boolean, delay: number): CSSProperties => ({
  opacity: open ? 1 : 0,
  transform: open ? 'none' : 'translateY(10px)',
  transition: animate ? `opacity 320ms ${EASE} ${open ? delay : 0}ms, transform 420ms ${EASE} ${open ? delay : 0}ms` : 'none',
})

function ResultCard({ job, open, animate, onRegenerate, onClose }: {
  job: DocGenJob | null; open: boolean; animate: boolean; onRegenerate: () => void
  /** 있으면 오른쪽 미리보기 패널로 그린다 */
  onClose?: () => void
}) {
  const [tab, setTab] = useState<PreviewTab>('doc')
  const r = job?.result
  if (!job || !r) return null
  const info: [string, string][] = [
    ['양식', job.template_name],
    ['근거 자료', `${r.sources_count}건 · 첨부 ${job.attachments.length}개`],
    ['소요 시간', formatDuration(job.started_at ?? job.created_at, job.finished_at) || '-'],
    ['완료 시각', formatClock(job.finished_at) || '-'],
  ]
  const tabs: [PreviewTab, string][] = [['doc', '문서'], ['files', `첨부 자료 ${job.attachments.length}`], ['request', '요청 정보']]
  const request: [string, string][] = [
    ['요청 내용', job.prompt],
    ['양식', job.template_name],
    ['파일 유형', OUTPUT_FORMATS.find((f) => f.code === job.output_format)?.label ?? job.output_format],
    ['분량', LENGTHS.find((l) => l.code === job.length)?.label ?? '-'],
    ['요청 시각', formatClock(job.created_at) || '-'],
  ]
  const panel = !!onClose
  return (
    <div className={`flex flex-col gap-4 ${panel ? 'p-5' : 'p-4 sm:p-5'}`}>
      <div className="flex flex-wrap items-center gap-3" style={reveal(open, animate, 240)}>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white"><DocIcon className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-text-primary">{r.file_name}</p>
          <p className="mt-0.5 text-[12px] text-text-secondary">{job.output_format} · {formatBytes(r.size)} · {r.page_count}쪽</p>
        </div>
        <div className="flex gap-2 max-sm:w-full">
          <button type="button" onClick={onRegenerate} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-brand-soft bg-surface px-4 text-[13px] font-semibold text-text-secondary transition-colors hover:text-brand max-sm:flex-1">
            <RetryIcon className="h-3.5 w-3.5" /> 다시 생성
          </button>
          <button type="button" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-brand px-5 text-[13.5px] font-bold text-white shadow-[0_6px_16px_rgba(220,20,60,0.25)] transition-colors hover:bg-brand-hover max-sm:flex-1">
            <DownloadIcon className="h-4 w-4" /> 다운로드
          </button>
          {panel && (
            <button type="button" aria-label="미리보기 닫기" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-primary">
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4" style={reveal(open, animate, 320)}>
        {info.map(([k, v]) => (
          <div key={k} className={`min-w-0 rounded-xl px-3 py-2.5 ${panel ? 'bg-surface-card1' : 'bg-surface/80'}`}>
            <dt className="text-[11.5px] text-text-muted">{k}</dt>
            <dd className="mt-0.5 truncate text-[13px] font-semibold text-text-primary">{v}</dd>
          </div>
        ))}
      </dl>

      {/* 미리보기: 막대가 다 펼쳐질 즈음 아래에서 떠오른다. 탭을 바꾸면 칸 높이도 따라 바뀐다 */}
      <section aria-label="미리보기" className={`overflow-hidden rounded-2xl border bg-surface ${panel ? 'border-surface-border' : 'border-brand-soft'}`} style={reveal(open, animate, 440)}>
        <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-surface-border px-3 pt-3 text-[13px]">
          {tabs.map(([key, label]) => (
            <button key={key} role="tab" type="button" aria-selected={tab === key} onClick={() => setTab(key)}
              className={`shrink-0 px-3 pb-2.5 font-semibold transition-colors ${tab === key ? 'border-b-2 border-brand text-brand' : 'text-text-muted hover:text-text-primary'}`}>
              {label}
            </button>
          ))}
        </div>
        <div role="tabpanel" className="bg-surface-card1 p-4 sm:p-6">
          {tab === 'doc' && <Paper job={job} compact />}
          {tab === 'files' && (
            job.attachments.length === 0
              ? <p className="py-6 text-center text-[13px] text-text-muted">첨부 없이 요청 내용만으로 작성했습니다.</p>
              : (
                <ul className="flex flex-col gap-2">
                  {job.attachments.map((a) => (
                    <li key={a.name} className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface px-3.5 py-3">
                      <DocIcon className="h-4 w-4 shrink-0 text-brand" />
                      <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-text-primary">{a.name}</span>
                      <span className="shrink-0 text-[12px] text-text-muted">{formatBytes(a.size)}</span>
                    </li>
                  ))}
                </ul>
              )
          )}
          {tab === 'request' && (
            <dl className="flex flex-col gap-3 rounded-xl border border-surface-border bg-surface p-4">
              {request.map(([k, v]) => (
                <div key={k} className="grid gap-1 sm:grid-cols-[88px_1fr] sm:gap-3">
                  <dt className="text-[12px] text-text-muted">{k}</dt>
                  <dd className="text-[13.5px] leading-relaxed text-text-primary">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>
    </div>
  )
}

/* ───────── 화면 ───────── */
function Stage({ state, scenario }: { state: PageState; scenario: Scenario }) {
  const [prompt, setPrompt] = useState(scenario.prompt)
  const [templateId, setTemplateId] = useState(scenario.templateId)
  const [format, setFormat] = useState<DocGenOutputFormat | null>(scenario.selected?.output_format ?? null)
  const [job, setJob] = useState<DocGenJob | null>(scenario.selected)
  const [phase, setPhase] = useState<Phase>(PHASE_OF[state])
  // 다시 보낼 때 한 번 움직임 없이 처음 자리로 되돌린다
  const [instant, setInstant] = useState(false)
  const [reduce] = useState(prefersReducedMotion)
  const { later, every, frame, clear } = useTimers()

  const { geo, ready, wrapRef, composerRef, slotRef, laneRef, cardRef, panelRef } = useGeometry()
  const pageRef = useRef<HTMLDivElement>(null)
  const asideRef = useRef<HTMLElement>(null)
  const panelBoxRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const flyRef = useRef<HTMLDivElement>(null)

  // v5처럼 배치가 상태를 따라간다: 미리보기가 열리면 두 열, 닫히면 가운데 한 열
  const vp = useViewport()
  const wideRef = useRef(vp.wide)
  useEffect(() => { wideRef.current = vp.wide })
  const [sideOpen, setSideOpen] = useState(state === 'completed')
  const side = vp.wide && sideOpen
  // 막대가 내려앉은 높이(패널 상자 기준). 여기서부터 위아래로 펼쳐진다
  const [panelFrom, setPanelFrom] = useState(0)

  const template = TEMPLATES.find((t) => t.template_id === templateId)
  const canSubmit = !!prompt.trim() && !!template
  const editable = phase === 'compose' || phase === 'done' || phase === 'failed'

  /* 목 생성: 대기 → 생성 중(진행률) → 완료 또는 실패 */
  const simulate = (base: DocGenJob) => {
    const willFail = base.prompt.includes('실패')
    const startedAt = new Date().toISOString()
    let p = 0
    every(TICK, () => {
      p = Math.min(100, p + STEP)
      if (willFail && p >= 45) {
        clear()
        setJob({ ...base, status: 'FAILED', stage: 'DRAFTING', progress: p, eta_seconds: null, started_at: startedAt, finished_at: new Date().toISOString(), error: { code: 'LLM_SERVER_ERROR', detail: '' } })
        setPhase('failed')
        return
      }
      if (p >= 100) {
        clear()
        setJob({
          ...base, status: 'COMPLETED', stage: 'FORMATTING', progress: 100, queue_position: null, eta_seconds: null,
          started_at: startedAt, finished_at: new Date().toISOString(),
          result: { ...LIVE_BASE.result!, file_name: `${base.template_name} 초안.${base.output_format.toLowerCase()}` },
        })
        setPhase('rejoin')
        later(T.rejoin + 80, () => {
          if (wideRef.current) return shift()
          setPhase('done')
          // 펼쳐지는 칸이 화면 밖으로 내려가면 따라 내려간다
          later(T.open * 0.5, () => cardRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' }))
        })
        return
      }
      setJob({ ...base, status: 'RUNNING', stage: stageAt(p), progress: p, queue_position: null, eta_seconds: Math.max(1, Math.round((((100 - p) / STEP) * TICK) / 1000)), started_at: startedAt })
    })
  }

  /** 전송 → 내려감 → 선 긋기 → 막대로 합쳐짐 → 끝이 떨어져 중지 버튼 */
  const play = (next: DocGenJob) => {
    clear()
    setInstant(false)
    setJob(next)
    setPhase('drop')
    let at = T.drop
    later(at, () => setPhase('draw'))
    at += T.draw
    later(at, () => setPhase('merge'))
    at += T.merge + T.hold
    later(at, () => setPhase('track'))
    later(QUEUE_MS, () => simulate(next))
  }

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

  /** 결과·실패 화면에서 다시 보낼 때: 미리보기를 접고 → 처음 자리로 → 재생 */
  const restart = (next: DocGenJob) => {
    clear()
    setPhase('closing')
    setSideOpen(false)
    later(side ? T.shift : T.close, () => {
      setInstant(true)
      setPhase('compose')
      later(50, () => play(next))
    })
  }

  const makeJob = (): DocGenJob => {
    const tpl = template!
    const now = new Date().toISOString()
    return {
      ...LIVE_BASE, job_id: `live-${Date.now()}`, title: titleOf(prompt), prompt: prompt.trim(),
      template_id: tpl.template_id, template_name: tpl.name, output_format: format ?? tpl.default_format,
      attachments: scenario.attachments.map(({ name, size }) => ({ name, size })),
      status: 'QUEUED', stage: null, progress: 0, queue_position: 1, eta_seconds: Math.round((QUEUE_MS + (100 / STEP) * TICK) / 1000),
      error: null, created_at: now, started_at: null, finished_at: null, result: null,
    }
  }

  const send = () => {
    if (!canSubmit) return
    if (phase === 'compose') play(makeJob())
    else if (phase === 'done' || phase === 'failed') restart(makeJob())
  }

  const stop = () => {
    clear()
    setJob((j) => j && { ...j, status: 'CANCELLED', eta_seconds: null, finished_at: new Date().toISOString(), error: { code: 'CANCELLED', detail: '' } })
    setPhase('failed')
  }

  /* ── 좌표 ── */
  const g = geo ?? { slotX: 0, slotY: 0, laneTop: 0, width: 0, cardH: 0, panelH: 0 }
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

  // 오른쪽 미리보기 패널 — 내려앉은 막대(land)에서 위아래로 펼쳐진다
  const panelOn = side && (phase === 'land' || phase === 'done')
  const panelStyle: CSSProperties = phase === 'land'
    ? { transform: `translateY(${panelFrom}px)`, height: BAR, borderRadius: BAR / 2, backgroundColor: 'var(--color-brand)', boxShadow: '0 0 0 1px transparent', transition: 'none' }
    : {
      transform: 'none', height: Math.min(g.panelH, Math.max(320, vp.h - 150)), borderRadius: 20, opacity: panelOn ? 1 : 0,
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
      <p className="mt-2 text-center text-[13.5px] text-text-secondary">요청과 자료를 주시면 고른 양식에 맞춰 초안을 써 드립니다.</p>

      <div ref={wrapRef} className="relative mt-7">
        <section ref={composerRef} aria-label="문서 요청"
          className={`rounded-[28px] border bg-surface shadow-[0_12px_30px_rgba(220,20,60,0.05)] transition-colors ${editable ? 'border-brand-soft focus-within:border-brand' : 'border-surface-border'}`}>
          <label htmlFor="v6-prompt" className="sr-only">프롬프트</label>
          <textarea id="v6-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} readOnly={!editable} rows={3}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() } }}
            placeholder="만들 문서를 설명해 주세요. 참고 자료는 첨부하세요."
            className={`w-full resize-none bg-transparent px-5 pt-5 text-[15px] leading-relaxed outline-none placeholder:text-text-muted sm:px-6 ${editable ? 'text-text-primary' : 'text-text-secondary'}`} />
          {scenario.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4">{scenario.attachments.map((a) => <AttachmentChip key={a.name} {...a} />)}</div>
          )}
          <div className="flex flex-wrap items-center gap-1 px-3 pb-3 pt-2">
            <button type="button" aria-label="파일 첨부" disabled={!editable} className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-brand-subtle hover:text-brand disabled:pointer-events-none disabled:opacity-60">
              <ClipIcon className="h-[18px] w-[18px]" />
            </button>
            <Picker label="파일 유형" value={format} disabled={!editable} onChange={(v) => setFormat(v as DocGenOutputFormat)}
              options={OUTPUT_FORMATS.map((f) => ({ value: f.code, label: f.label }))} />
            <Picker label="양식" value={templateId} disabled={!editable} icon={<DocIcon className="h-3.5 w-3.5" />}
              onChange={(v) => {
                setTemplateId(v)
                if (!format) setFormat(TEMPLATES.find((t) => t.template_id === v)?.default_format ?? null)
              }}
              options={TEMPLATES.map((t) => ({ value: t.template_id, label: t.name, hint: t.description }))} />
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
              {!vp.wide && <ResultCard key={job?.job_id} job={job} open={phase === 'done'} animate={animate} onRegenerate={() => canSubmit && restart(makeJob())} />}
            </div>
          </div>

          {/* 누르는 겹 (필터 없이 아이콘·글자) */}
          <button type="button" aria-label="생성 요청" disabled={!canSubmit || phase !== 'compose'} tabIndex={phase === 'compose' ? 0 : -1} onClick={send}
            className={`absolute left-0 top-0 flex items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 disabled:hover:bg-transparent ${pillOn ? 'pointer-events-auto' : ''} ${canSubmit ? '' : 'text-text-muted'}`}
            style={{ ...pillStyle, boxShadow: phase === 'compose' && canSubmit ? '0 5px 13px rgba(220,20,60,0.28)' : '0 0 0 rgba(220,20,60,0)' }}>
            <ArrowUpIcon className={`h-5 w-5 transition-opacity duration-150 ${phase === 'compose' ? 'opacity-100' : 'opacity-0'}`} />
          </button>

          <button type="button" aria-label={phase === 'failed' ? '다시 시도' : '생성 중지'} title={phase === 'failed' ? '다시 시도' : '중지'} tabIndex={detached ? 0 : -1}
            onClick={phase === 'failed' ? () => canSubmit && restart(makeJob()) : stop}
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
              ? <DoneLine job={job} previewOpen={side} onOpen={() => setSideOpen(true)} />
              : lineOn && <StatusLine job={job} phase={phase} />}
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-[11.5px] text-text-muted">MARS v1.0.0은 AI이므로 실수를 할 수 있습니다. 중요한 정보는 재차 확인하십시오.</p>
      <p className="mt-6 text-center text-[11.5px] text-text-hint">
        <span className="text-text-muted">시안 메모 · 직접 보내면 움직임이 처음부터 재생됩니다. 프롬프트에 ‘실패’를 넣으면 실패 흐름을 볼 수 있습니다.</span>
      </p>
      </div>

      {/* 오른쪽 미리보기 열 (넓은 화면). 열이 자라는 동안 막대가 날아와 내려앉고, 그 자리에서 펼쳐진다 */}
      <aside ref={asideRef} aria-label="미리보기" aria-hidden={!panelOn} inert={!panelOn} className="relative min-w-0 max-lg:hidden"
        style={{ opacity: side ? 1 : 0, transform: side ? 'none' : 'translateX(32px)', transition: tr([['opacity', 400], ['transform', T.shift]]) }}>
        <div ref={panelBoxRef} className="sticky top-6">
          <div className="overflow-hidden" style={panelStyle}>
            <div className="custom-scroll h-full overflow-y-auto">
              <div ref={panelRef}>
                {vp.wide && <ResultCard key={job?.job_id} job={job} open={phase === 'done'} animate={animate} onRegenerate={() => canSubmit && restart(makeJob())} onClose={() => setSideOpen(false)} />}
              </div>
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
  const { state, scenario } = useDraftScenario()
  return (
    <div className="flex h-full flex-col">
      <DraftBar current="v6" />
      <div className="custom-scroll min-h-0 flex-1 overflow-y-auto">
        {/* 상단 상태 막대로 시나리오를 바꾸면 화면 안의 값·타이머가 초기화된다 */}
        <Stage key={state} state={state} scenario={scenario} />
      </div>
    </div>
  )
}
