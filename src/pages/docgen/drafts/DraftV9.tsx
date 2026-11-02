// TEMP(시안 비교용) v9 로프 고리 버튼 (A안): 전송 버튼이 그 자리에서 중지 버튼이 되고, 둘레에 로프 고리가 감긴다.
//   보냄·대기 → 버튼이 흰 중지 버튼으로 바뀌고, 회색 로프 고리가 천천히 돈다
//   생성 중   → 고리가 서버 진행률만큼 빨갛게 찬다. 입력창 아래 한 줄에 진행률·경과 시간·남은 시간(어림)
//   완료      → 고리가 다 닫히고 버튼에 체크가 그려진 뒤, 넓은 화면은 오른쪽에 미리보기 열이 열리고
//               좁은 화면은 상태 줄 아래로 미리보기가 펼쳐진다. 버튼은 다시 전송 버튼으로 돌아온다
//   실패·중지 → 고리가 멈춘 자리에서 빨강(실패)·회색(중지)이 되고, 버튼은 다시 시도 버튼이 된다
// 완료는 진행률(100%)이 아니라 서버 상태값(완료)으로만 판단한다. 남은 시간은 서버가 주지 않으므로 속도로 어림한다.
// 결과는 무작위이고, 프롬프트에 '실패'·'취소'를 넣으면 고정된다.
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import type { DocGenJob } from '../../../types/docgen'
import { normalizeJobStatus } from '../../../utils/docgen'
import { useCancelDocGenJob, useDocGenJobs, useRetryDocGenJob } from '../../../hooks/useDocGen'
import { showToast } from '../../../api/store/toastStore'
import { useComposer, useFreshIds } from '../../../features/docgen/hooks'
import { ArrowUpIcon, RetryIcon, StopIcon } from '../../../features/docgen/icons'
import { ComposerOptions } from '../../../features/docgen/components'
import DraftBar from './DraftBar'
import { useFreshDraft } from './draftState'
import { EASE, SPRING, prefersReducedMotion, rise, useTimers, useViewport } from './emblemHooks'
import { DoneLine, DrawnCheck, JobList, PreviewCard, RopeRing, StatusLine } from './emblemParts'
import './DraftV7.css'
import './emblemDrafts.css'

type Phase = 'compose' | 'sending' | 'track' | 'finish' | 'done' | 'failed' | 'closing'

/** 단계별 움직임 시간(ms) */
const T = { finish: 760, shift: 780, close: 420 }
const RING = 56 // 버튼 둘레 고리 지름 (버튼 40)

/** 높이 0 ↔ 내용 높이로 부드럽게 접고 펴기 */
function Collapse({ open, animate, children }: { open: boolean; animate: boolean; children: ReactNode }) {
  return (
    <div aria-hidden={!open} inert={!open} className="grid"
      style={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0, transition: animate ? `grid-template-rows 520ms ${EASE}, opacity 360ms ${EASE}` : 'none' }}>
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  )
}

function Stage() {
  const { jobs, isLoading } = useDocGenJobs()
  const c = useComposer()
  const cancel = useCancelDocGenJob()
  const retry = useRetryDocGenJob()
  const [liveId, setLiveId] = useState<string | null>(null)
  const [awaiting, setAwaiting] = useState(false)
  const job = jobs.find((j) => j.job_id === liveId) ?? null
  const liveState = job ? normalizeJobStatus(job.status) : null
  const [phase, setPhase] = useState<Phase>('compose')
  const [reduce] = useState(prefersReducedMotion)
  const animate = !reduce
  const { later, clear } = useTimers()

  const vp = useViewport()
  const [sideOpen, setSideOpen] = useState(false)
  const side = vp.wide && sideOpen
  const [viewId, setViewId] = useState<string | null>(null)
  const viewed = jobs.find((j) => j.job_id === viewId) ?? null

  const settled = phase === 'done' || phase === 'failed' || phase === 'closing'
  const listJobs = jobs.filter((j) => j.job_id !== liveId || settled)
  const isFresh = useFreshIds(jobs.map((j) => j.job_id), !isLoading)
  const { canSubmit } = c
  const editable = phase === 'compose' || phase === 'done' || phase === 'failed'

  /** 다 만들어짐: 고리가 닫히고 체크가 그려진 뒤 미리보기를 연다 */
  const finish = () => {
    setPhase('finish')
    later(T.finish, () => {
      setViewId(null)
      setSideOpen(true)
      setPhase('done')
    })
  }

  // 서버 상태를 따라간다. 완료는 진행률이 아니라 상태값으로만 판단한다
  useEffect(() => {
    if (awaiting) return
    if (phase === 'track' && liveState === 'completed') later(0, finish)
    else if (phase === 'track' && liveState === 'failed') later(0, () => setPhase('failed'))
    else if (phase === 'failed' && (liveState === 'queued' || liveState === 'running')) later(0, () => setPhase('track'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, liveState, awaiting])

  /** 보내기: 버튼이 그 자리에서 중지 버튼이 되고 고리가 감긴다 */
  const play = (start: () => Promise<DocGenJob | null>, keepLive = false) => {
    clear()
    if (!keepLive) setLiveId(null)
    setAwaiting(true)
    setPhase('sending')
    start().then((next) => {
      setAwaiting(false)
      if (!next) return setPhase('compose')
      setLiveId(next.job_id)
      setPhase('track')
    })
  }

  /** 결과·실패 뒤 다시 보낼 때: 미리보기를 접은 뒤 재생 */
  const restart = (start: () => Promise<DocGenJob | null>, keepLive = false) => {
    clear()
    const wasSide = side
    setPhase('closing')
    setSideOpen(false)
    later(wasSide ? T.shift : T.close, () => play(start, keepLive))
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

  /* ── 버튼과 고리 ── */
  const cancelled = job?.error?.code === 'CANCELLED'
  const queued = phase === 'sending' || (phase === 'track' && liveState !== 'running')
  const working = phase === 'sending' || phase === 'track'
  const ringOn = working || phase === 'finish' || phase === 'failed'
  const ringValue = phase === 'finish' ? 100 : queued ? undefined : job?.progress ?? 0
  const ringColor = phase === 'failed' ? (cancelled ? 'var(--color-text-muted)' : 'var(--color-status-error)') : queued ? 'var(--color-text-muted)' : 'var(--color-brand)'
  const mode: 'send' | 'stop' | 'check' | 'retry' = working ? 'stop' : phase === 'finish' ? 'check' : phase === 'failed' ? 'retry' : 'send'
  const btnLabel = { send: '생성 요청', stop: '생성 중지', check: '완료', retry: '다시 시도' }[mode]
  const onBtn = mode === 'send' ? send : mode === 'stop' ? stop : mode === 'retry' ? retryLive : undefined
  const solid = mode === 'send'
  const btnClass = solid
    ? (canSubmit ? 'bg-gradient-to-br from-brand to-brand-light text-white shadow-[0_5px_13px_rgba(220,20,60,0.28)]' : 'bg-surface-subtle text-text-muted')
    : `bg-surface shadow-[inset_0_0_0_1px_var(--color-surface-border)] ${mode === 'stop' ? 'text-text-primary hover:bg-surface-card1' : 'text-brand'} ${mode === 'retry' ? 'hover:bg-brand-subtle' : ''}`
  const btnDisabled = mode === 'send' ? !canSubmit || phase === 'closing' : mode === 'check' || (mode === 'stop' && phase === 'sending')
  const iconSwap: CSSProperties = { transition: animate ? `scale 420ms ${SPRING}, opacity 200ms ${EASE}` : 'none' }

  /* ── 상태 줄·미리보기 ── */
  const lineOpen = working || phase === 'finish' || phase === 'failed' || (phase === 'done' && !!job)
  const sheetOpen = !vp.wide && phase === 'done' && !!job && normalizeJobStatus(job.status) === 'completed'
  const panelJob = viewed ?? job
  const panelOn = side && (viewed ? phase !== 'closing' : phase === 'done')
  const panelH = Math.max(320, vp.h - 150)
  const previewing = viewed ? viewId : side && settled ? liveId : null
  const listSelected = vp.wide ? (side ? previewing : null) : viewId

  return (
    <div className="relative mx-auto w-full max-w-[1360px] px-4 pb-24 pt-[14vh] sm:px-6 lg:grid"
      style={{ gridTemplateColumns: side ? 'minmax(0,0.9fr) minmax(0,1.1fr)' : 'minmax(0,1fr) minmax(0,0fr)', columnGap: side ? 40 : 0, transition: animate ? `grid-template-columns ${T.shift}ms ${EASE}, column-gap ${T.shift}ms ${EASE}` : 'none' }}>
      <div className="mx-auto w-full min-w-0 max-w-[720px]">
        <div {...rise(0)}>
          <h1 className="text-center text-[24px] font-bold text-text-primary sm:text-[28px]">
            어떤 <span className="text-brand">문서</span>를 만들까요?
          </h1>
          <p className="mt-2 text-center text-[13.5px] text-text-secondary">요청을 적고 양식을 고르면 그 양식에 맞춰 초안을 써 드립니다.</p>
        </div>

        <div className={`relative z-10 mt-9 ${rise(120).className}`} style={rise(120).style}>
          <section aria-label="문서 요청"
            className={`rounded-[28px] border bg-surface shadow-[0_12px_30px_rgba(220,20,60,0.05)] transition-[border-color,box-shadow] duration-500 focus-within:shadow-[0_18px_44px_rgba(220,20,60,0.09)] ${editable ? 'border-brand-soft focus-within:border-brand' : 'border-surface-border'}`}>
            <label htmlFor="v9-prompt" className="sr-only">프롬프트</label>
            <textarea id="v9-prompt" value={c.prompt} onChange={(e) => c.setPrompt(e.target.value)} readOnly={!editable} rows={3}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() } }}
              placeholder="만들 문서를 설명해 주세요."
              className={`w-full resize-none bg-transparent px-5 pt-5 text-[15px] leading-relaxed outline-none placeholder:text-text-muted sm:px-6 ${editable ? 'text-text-primary' : 'text-text-secondary'}`} />
            <div className="flex flex-wrap items-center gap-1 px-3 pb-3 pt-2">
              <ComposerOptions c={c} disabled={!editable} withTemplate />
              <span className="flex-1" />
              {/* 전송 자리: 같은 버튼이 전송 → 중지 → 체크 → 다시 전송으로 바뀌고, 둘레에 로프 고리가 감긴다 */}
              <div className="relative h-10 w-10 shrink-0">
                <span className="absolute" style={{
                  left: (40 - RING) / 2, top: (40 - RING) / 2, width: RING, height: RING,
                  opacity: ringOn ? 1 : 0, scale: ringOn ? 1 : 0.6,
                  transition: animate ? `opacity 260ms ${EASE}, scale 560ms ${SPRING}` : 'none',
                }}>
                  <RopeRing size={RING} stroke={4} value={ringValue} spin={queued ? 'slow' : null} color={ringColor} />
                </span>
                <button type="button" aria-label={btnLabel} title={btnLabel} disabled={btnDisabled} onClick={onBtn}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-[background-color,color,box-shadow] duration-300 active:scale-95 ${btnClass}`}>
                  <span className="absolute flex" style={{ ...iconSwap, opacity: mode === 'send' ? 1 : 0, scale: mode === 'send' ? 1 : 0.4 }}><ArrowUpIcon className="h-5 w-5" /></span>
                  <span className="absolute flex" style={{ ...iconSwap, opacity: mode === 'stop' ? 1 : 0, scale: mode === 'stop' ? 1 : 0.4 }}><StopIcon className="h-3.5 w-3.5" /></span>
                  <span className="absolute flex" style={{ ...iconSwap, opacity: mode === 'retry' ? 1 : 0, scale: mode === 'retry' ? 1 : 0.4 }}><RetryIcon className="h-4 w-4" /></span>
                  {mode === 'check' && <span className="absolute flex"><DrawnCheck className="h-5 w-5" /></span>}
                </button>
              </div>
            </div>
          </section>

          {/* 상태 한 줄: 진행 중에는 진행률·경과, 완료 뒤에는 소요 시간 */}
          <Collapse open={lineOpen} animate={animate}>
            <div aria-live="polite" className="flex min-h-11 items-center justify-between gap-3 px-4 pt-3 text-[12px] text-text-secondary">
              {phase === 'done' ? <DoneLine job={job} /> : <StatusLine job={job} finishing={phase === 'finish'} />}
            </div>
          </Collapse>

          {/* 좁은 화면: 완료되면 상태 줄 아래로 미리보기가 펼쳐진다 */}
          {!vp.wide && (
            <Collapse open={sheetOpen} animate={animate}>
              <div className="mt-3 overflow-hidden rounded-[20px] bg-brand-subtle shadow-[inset_0_0_0_1px_var(--color-brand-soft)]">
                <PreviewCard key={job?.job_id} job={job} open={sheetOpen} animate={animate} />
              </div>
            </Collapse>
          )}
        </div>

        <p className={`mt-4 text-center text-[11.5px] text-text-muted ${rise(200).className}`} style={rise(200).style}>MARS v1.0.0은 AI이므로 실수를 할 수 있습니다. 중요한 정보는 재차 확인하십시오.</p>

        <section aria-label="생성 문서" className={`mt-16 ${rise(280).className}`} style={rise(280).style}>
          <JobList jobs={listJobs} isFresh={isFresh} selectedId={listSelected} justDoneId={settled ? liveId : null} wide={vp.wide} onView={view} />
        </section>

        <p className="mt-10 text-center text-[11.5px] text-text-hint">
          <span className="text-text-muted">시안 메모 · 결과(완료·실패·취소)는 무작위입니다. 프롬프트에 ‘실패’·‘취소’를 넣으면 그 흐름으로 고정됩니다.</span>
        </p>
      </div>

      {/* 오른쪽 미리보기 열 (넓은 화면) */}
      <aside aria-label="미리보기" aria-hidden={!panelOn} inert={!panelOn} className="relative min-w-0 max-lg:hidden"
        style={{ opacity: side ? 1 : 0, transform: side ? 'none' : 'translateX(32px)', transition: animate ? `opacity 400ms ${EASE}, transform ${T.shift}ms ${EASE}` : 'none' }}>
        <div className="sticky top-6">
          <div className="overflow-hidden rounded-[20px] bg-surface shadow-[0_0_0_1px_var(--color-surface-border),0_30px_60px_-18px_rgba(0,0,0,0.14)]"
            style={{ height: panelH, opacity: panelOn ? 1 : 0, transition: animate ? `opacity ${T.close}ms ${EASE}` : 'none' }}>
            <div className="custom-scroll h-full overflow-y-auto">
              {vp.wide && (
                <PreviewCard key={panelJob?.job_id} job={panelJob} open={panelOn} animate={!viewed && animate}
                  onClose={() => setSideOpen(false)} />
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default function DraftV9() {
  useFreshDraft()
  return (
    <div className="flex h-full flex-col">
      <DraftBar current="v9" />
      <div className="custom-scroll min-h-0 flex-1 overflow-y-auto">
        <Stage />
      </div>
    </div>
  )
}
