// 문서 스튜디오 편집기: 왼쪽 쪽·장 목록 · 가운데 캔버스 · 오른쪽 수정 기록과 수정 요청.
//   - 처음 만드는 중이면 개요 제목으로 빈 쪽을 깔고, 진행률만큼 차례로 채워 보여 준다.
//   - 캔버스에서 제목·표 같은 부분을 누르면 그 부분을 대상으로 고친다. 대상은 '이 장 / 전체'로 넓힐 수 있다.
//   - 고칠 때마다 새 버전이 쌓이고, 지난 버전을 골라 보거나 그 버전을 기준으로 다시 고칠 수 있다.
//   - 발표 자료는 '발표 보기'로 한 장씩 크게 넘겨 본다 (←·→·Esc).
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { DocGenJob, DocGenKind, DocGenPage, DocGenPageElement } from '../../types/docgen'
import { useCancelDocGenJob, useReviseDocGenJob, useRetryDocGenJob } from '../../hooks/useDocGen'
import { showToast } from '../../api/store/toastStore'
import { KIND_LABEL, formatClock, formatEta, getJobErrorMessage, isJobActive, normalizeJobStatus } from '../../utils/docgen'
import { DownloadButton, Picker, ProgressBar, Spinner, StatusDot } from '../../features/docgen/components'
import { AlertIcon, ArrowUpIcon, ChevronIcon, RetryIcon, StopIcon, XIcon } from '../../features/docgen/icons'
import { useStudioDoc } from '../../features/studio/hooks'
import { PageSkeleton, PageView } from '../../features/studio/PageView'
import { ELEMENT_LABEL, FRAME } from '../../features/studio/constants'
import '../../features/studio/studio.css'

type Scope = 'page' | 'all'

const SUGGEST: Record<DocGenKind, Record<Scope, string[]>> = {
  deck: {
    page: ['표로 바꿔 줘', '그래프로 보여 줘', '두 단으로 비교해 줘', '더 짧게 줄여 줘', '항목 하나 추가해 줘', '이 장 삭제해 줘'],
    all: ['전체를 더 짧게 줄여 줘', '장 하나 추가해 줘', '전체를 표 중심으로 바꿔 줘'],
  },
  doc: {
    page: ['표로 정리해 줘', '더 짧게 줄여 줘', '내용 추가해 줘', '이 항목 삭제해 줘'],
    all: ['전체를 더 짧게 줄여 줘', '항목 하나 추가해 줘'],
  },
}

/** 입력 중에는 화살표로 쪽을 넘기지 않는다 */
const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))

/** 이 버전에서 바뀐 쪽 (이전 버전과 내용이 다른 쪽) */
const changedPages = (pages: DocGenPage[], before: DocGenPage[] | undefined) => {
  if (!before) return new Set<string>()
  const prev = new Map(before.map((p) => [p.page_id, JSON.stringify(p)]))
  return new Set(pages.filter((p) => prev.get(p.page_id) !== JSON.stringify(p)).map((p) => p.page_id))
}

const targetLabel = (job: DocGenJob, pages: DocGenPage[], unit: string) => {
  if (!job.target_page_id) return '전체'
  const i = pages.findIndex((p) => p.page_id === job.target_page_id)
  const at = i >= 0 ? `${i + 1}${unit}` : `지워진 ${unit}`
  return job.target_element ? `${at} · ${ELEMENT_LABEL[job.target_element]}` : at
}

export default function StudioEditorPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const doc = useStudioDoc(id)
  const revise = useReviseDocGenJob()
  const cancel = useCancelDocGenJob()
  const retry = useRetryDocGenJob()

  // 보고 있는 버전. null이면 다 만들어진 마지막 버전을 따라간다
  const [versionId, setVersionId] = useState<string | null>(null)
  const [pageId, setPageId] = useState<string | null>(null)
  const [pick, setPick] = useState<DocGenPageElement | null>(null)
  const [scope, setScope] = useState<Scope>('page')
  const [text, setText] = useState('')
  const [presenting, setPresenting] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const historyRef = useRef<HTMLOListElement>(null)

  const { root, versions, latestDone, active } = doc
  const shown = versions.find((v) => v.job_id === versionId && v.result) ?? latestDone
  const kind: DocGenKind = (shown ?? root)?.kind ?? 'deck'
  const unit = KIND_LABEL[kind].unit
  const pages = shown?.result?.pages ?? []
  const index = Math.max(0, pages.findIndex((p) => p.page_id === pageId))
  const page = pages[index] ?? null
  const docTitle = shown?.title ?? root?.title ?? ''

  // 처음 만드는 중 / 처음부터 실패
  const firstRun = !latestDone && root ? root : null
  const generating = firstRun && isJobActive(firstRun) ? firstRun : null
  const firstFailed = firstRun && normalizeJobStatus(firstRun.status) === 'failed' ? firstRun : null
  // 고치는 중인 버전. 그 기준 버전을 보고 있으면 대상 쪽을 덮어 표시한다
  const revising = active && active.version > 1 ? active : null
  const busy = revising && shown && revising.parent_job_id === shown.job_id
    ? new Set(revising.target_page_id ? [revising.target_page_id] : pages.map((p) => p.page_id))
    : new Set<string>()
  const parentPages = versions.find((v) => v.job_id === shown?.parent_job_id)?.result?.pages
  const changed = changedPages(pages, parentPages)

  const go = (i: number) => {
    const next = pages[Math.min(pages.length - 1, Math.max(0, i))]
    if (!next || next.page_id === page?.page_id) return
    setPageId(next.page_id)
    setPick(null)
  }

  // 화살표로 쪽 넘기기 (발표 보기는 따로 처리)
  useEffect(() => {
    if (presenting) return
    const on = (e: KeyboardEvent) => {
      if (typing(e.target)) return
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); go(index + 1) }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1) }
      if (e.key === 'Escape') setPick(null)
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  })

  // 버전이 늘면 수정 기록 끝으로 내린다
  useEffect(() => {
    const el = historyRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [versions.length])

  const choose = (el: DocGenPageElement) => {
    setScope('page')
    setPick((cur) => (cur === el ? null : el))
  }

  const submit = async () => {
    const instruction = text.trim()
    if (!instruction || !shown || active) return
    try {
      await revise.mutateAsync({
        jobId: shown.job_id,
        instruction,
        page_id: scope === 'page' ? page?.page_id ?? null : null,
        element: scope === 'page' ? pick : null,
      })
      setText('')
      setPick(null)
      // 다 고쳐지면 새 버전을 바로 보여 준다
      setVersionId(null)
    } catch {
      showToast('수정 요청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  const onError = { onError: () => showToast('요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.') }

  if (!doc.isLoading && !root)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <p className="text-[15px] font-semibold text-text-primary">{doc.isError ? '작업을 불러오지 못했습니다' : '문서를 찾을 수 없습니다'}</p>
        <button type="button" onClick={() => navigate('/studio')} className="rounded-full px-4 py-2 text-[13px] font-semibold text-brand hover:bg-brand-subtle">스튜디오로 돌아가기</button>
      </div>
    )

  /* ── 처음 만드는 중: 개요 제목으로 빈 쪽을 깔고 진행률만큼 채운다 ── */
  const planned = [...(kind === 'deck' ? ['표지'] : []), ...(root?.outline ?? []).map((o) => o.title)]
  const made = generating && normalizeJobStatus(generating.status) === 'running' ? Math.floor((generating.progress / 100) * planned.length) : 0
  const making = Math.min(made, planned.length - 1)

  const versionOptions = versions.filter((v) => v.result).map((v) => ({ value: v.job_id, label: `v${v.version}`, hint: v.instruction ?? '처음 만듦' }))
  const canvasW = kind === 'deck' ? 'max-w-[960px]' : 'max-w-[680px]'

  return (
    <div className="flex h-full flex-col bg-surface-card1">
      {/* ── 머리 ── */}
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-surface-border bg-surface/80 px-4 py-3 backdrop-blur-xl sm:px-5">
        <button type="button" onClick={() => navigate('/studio')} aria-label="스튜디오로"
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-[background-color,scale] duration-200 hover:bg-surface-subtle active:scale-90">
          <ChevronIcon className="h-4 w-4 rotate-90" />
        </button>
        {/* 좁은 화면에서는 제목이 한 줄을 다 쓰고 버튼들은 다음 줄로 내려간다 */}
        <div className="min-w-0 flex-1 max-sm:basis-[calc(100%-48px)]">
          <p className="truncate text-[15px] font-bold text-text-primary">{docTitle || ' '}</p>
          <p className="text-[11.5px] text-text-muted">
            {KIND_LABEL[kind].name} · {(shown ?? root)?.output_format} · {(shown ?? root)?.template_name}
            {shown && ` · ${pages.length}${unit}`}
          </p>
        </div>
        {versionOptions.length > 1 && (
          <Picker label="버전" value={shown?.job_id ?? null} options={versionOptions}
            onChange={(v) => { setVersionId(v === latestDone?.job_id ? null : v); setPick(null) }} />
        )}
        {kind === 'deck' && pages.length > 0 && (
          <button type="button" onClick={() => setPresenting(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold text-text-secondary transition-[background-color,scale] duration-200 hover:bg-surface-subtle active:scale-[.97]">
            <ArrowUpIcon className="h-3.5 w-3.5 rotate-90" /> 발표 보기
          </button>
        )}
        {shown && <DownloadButton job={shown} primary />}
      </header>

      <div className="flex min-h-0 flex-1 flex-col max-lg:overflow-y-auto lg:flex-row">
        {/* ── 쪽·장 목록 ── */}
        <nav aria-label={`${unit} 목록`} className="custom-scroll order-2 flex shrink-0 gap-3 overflow-x-auto border-surface-border bg-surface px-3 py-3 max-lg:border-t lg:order-1 lg:w-[184px] lg:flex-col lg:overflow-y-auto lg:border-r">
          {generating || firstFailed
            ? planned.map((t, i) => (
              <div key={i} className="w-[132px] shrink-0 lg:w-full">
                <p className="mb-1 text-[11px] font-semibold tabular-nums text-text-muted">{i + 1}</p>
                <div className={`relative overflow-hidden rounded-lg shadow-[0_0_0_1px_var(--color-surface-border)] ${i === making && generating ? 'ring-2 ring-brand/40' : ''}`}>
                  <PageSkeleton kind={kind} title={i < made ? t : undefined} />
                  {i === making && generating && <span className="st-sweep" />}
                </div>
              </div>
            ))
            : pages.map((p, i) => {
              const on = p.page_id === page?.page_id
              const isChanged = changed.has(p.page_id)
              return (
                <button key={isChanged ? `${p.page_id}@${shown?.version}` : p.page_id} type="button" aria-current={on} aria-label={`${i + 1}${unit} ${p.title}`}
                  onClick={() => { setPageId(p.page_id); setPick(null) }}
                  className="st-pop w-[132px] shrink-0 text-left lg:w-full" style={{ '--d': `${Math.min(i, 10) * 50}ms` } as CSSProperties}>
                  <p className={`mb-1 flex items-center gap-1 text-[11px] font-semibold tabular-nums ${on ? 'text-brand' : 'text-text-muted'}`}>
                    {i + 1}
                    {isChanged && <span className="rounded-full bg-brand px-1.5 text-[9.5px] font-bold text-white">바뀜</span>}
                  </p>
                  <div className={`relative overflow-hidden rounded-lg transition-shadow duration-300 ${on ? 'shadow-[0_0_0_2px_var(--color-brand)]' : 'shadow-[0_0_0_1px_var(--color-surface-border)] hover:shadow-[0_0_0_1px_var(--color-brand-soft)]'}`}>
                    <PageView page={p} kind={kind} index={i} docTitle={docTitle} />
                    {busy.has(p.page_id) && (
                      <span className="absolute inset-0 flex items-center justify-center bg-surface/50"><Spinner className="h-4 w-4 text-brand" /></span>
                    )}
                  </div>
                </button>
              )
            })}
        </nav>

        {/* ── 캔버스 ── */}
        {/* 좁은 화면에서는 화면 전체가 한 번에 스크롤되므로 캔버스는 내용 높이만큼 차지한다 */}
        <main className="custom-scroll order-1 flex flex-col items-center gap-4 px-4 py-6 max-lg:shrink-0 sm:px-8 lg:order-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto" onClick={() => setPick(null)}>
          {firstFailed ? (
            <div role="alert" className="mt-[10vh] flex max-w-[380px] flex-col items-center gap-2 rounded-[20px] bg-surface px-6 py-7 text-center shadow-[0_0_0_1px_var(--color-surface-border)]">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-status-error/12 text-status-error"><AlertIcon className="h-5 w-5" /></span>
              <p className="text-[15px] font-bold text-text-primary">{firstFailed.error?.code === 'CANCELLED' ? '만들기가 취소되었습니다' : '만들지 못했습니다'}</p>
              <p className="text-[12.5px] leading-relaxed text-text-secondary">{getJobErrorMessage(firstFailed.error?.code)}</p>
              <button type="button" disabled={retry.isPending} onClick={() => retry.mutate(firstFailed.job_id, onError)}
                className="mt-2 inline-flex h-10 items-center gap-1.5 rounded-full bg-brand px-5 text-[13.5px] font-bold text-white transition-[background-color,scale] duration-200 hover:bg-brand-hover active:scale-[.96] disabled:opacity-60">
                <RetryIcon className="h-4 w-4" /> 다시 만들기
              </button>
            </div>
          ) : generating || !page ? (
            <div className={`w-full ${canvasW}`}>
              <div className="relative overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--color-surface-border),0_30px_60px_-24px_rgba(0,0,0,0.18)]">
                <PageSkeleton kind={kind} title={planned[making]} />
                <span className="st-sweep" />
              </div>
              {generating && (
                <div aria-live="polite" className="mx-auto mt-5 flex max-w-[420px] flex-col gap-2">
                  <div className="flex items-center justify-between gap-3 text-[12px] text-text-secondary">
                    <span className="flex items-center gap-1.5 font-semibold text-text-primary">
                      <Spinner className="h-3 w-3 text-brand" />
                      {normalizeJobStatus(generating.status) === 'queued'
                        ? `대기 중 · 앞에 ${generating.queue_position ?? 0}건`
                        : `${making + 1} / ${planned.length}${unit} 만드는 중`}
                    </span>
                    <span className="tabular-nums">{generating.progress}%{generating.eta_seconds != null && ` · ${formatEta(generating.eta_seconds)}`}</span>
                  </div>
                  <ProgressBar value={generating.progress} />
                  <button type="button" disabled={cancel.isPending} onClick={() => cancel.mutate(generating.job_id, onError)}
                    className="mx-auto mt-1 inline-flex h-8 items-center gap-1 rounded-full px-3 text-[12.5px] font-semibold text-text-secondary transition-colors hover:bg-surface-subtle">
                    <StopIcon className="h-3 w-3" /> 중지
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div key={`${page.page_id}@${shown?.version}`} className={`st-pop relative w-full ${canvasW}`}>
                <div className="overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--color-surface-border),0_30px_60px_-24px_rgba(0,0,0,0.18)]">
                  <PageView page={page} kind={kind} index={index} docTitle={docTitle} pick={scope === 'page' ? pick : null} onPick={busy.size ? undefined : choose} />
                </div>
                {busy.has(page.page_id) && revising && (
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl bg-surface/45 backdrop-blur-[2px]">
                    <span className="st-sweep" />
                    <span className="relative flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-[12.5px] font-semibold text-text-primary shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                      <Spinner className="h-3 w-3 text-brand" /> 고치는 중 <span className="tabular-nums">{revising.progress}%</span>
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 text-[12px] text-text-muted" onClick={(e) => e.stopPropagation()}>
                <button type="button" aria-label={`이전 ${unit}`} disabled={index === 0} onClick={() => go(index - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-surface-subtle disabled:opacity-30"><ChevronIcon className="h-4 w-4 rotate-90" /></button>
                <span className="min-w-14 text-center tabular-nums">{index + 1} / {pages.length}</span>
                <button type="button" aria-label={`다음 ${unit}`} disabled={index === pages.length - 1} onClick={() => go(index + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-surface-subtle disabled:opacity-30"><ChevronIcon className="h-4 w-4 -rotate-90" /></button>
              </div>
              <p className="text-[11.5px] text-text-hint"><span className="text-text-muted">제목·표 같은 부분을 누르면 그 부분만 고칠 수 있습니다</span></p>
            </>
          )}
        </main>

        {/* ── 수정 기록과 수정 요청 ── */}
        <aside aria-label="수정" className="order-3 flex shrink-0 flex-col border-surface-border bg-surface max-lg:border-t lg:w-[360px] lg:border-l">
          <h2 className="px-5 pb-2 pt-4 text-[13px] font-semibold text-text-muted">수정 기록</h2>
          <ol ref={historyRef} className="custom-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pb-4 max-lg:max-h-[320px]">
            {versions.map((v) => {
              const s = normalizeJobStatus(v.status)
              const viewing = v.job_id === shown?.job_id
              const basePages = versions.find((p) => p.job_id === v.parent_job_id)?.result?.pages ?? []
              return (
                <li key={v.job_id} className="st-rise">
                  {v.instruction && (
                    <div className="mb-1.5 ml-8 rounded-2xl rounded-tr-md bg-brand-subtle px-3.5 py-2.5 text-[13px] leading-relaxed text-text-primary">
                      <span className="mb-1 block text-[11px] font-semibold text-brand">{targetLabel(v, basePages, unit)}</span>
                      {v.instruction}
                    </div>
                  )}
                  <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] transition-colors ${viewing ? 'bg-surface-card1' : ''}`}>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold tabular-nums ${viewing ? 'bg-brand text-white' : 'bg-surface-subtle text-text-secondary'}`}>v{v.version}</span>
                    <StatusDot job={v} />
                    <span className="min-w-0 flex-1 truncate text-text-secondary">
                      {s === 'completed' ? (v.version === 1 ? `처음 만듦 · ${v.result?.page_count ?? 0}${unit}` : '고쳤습니다')
                        : s === 'failed' ? (v.error?.code === 'CANCELLED' ? '취소됨' : getJobErrorMessage(v.error?.code).split('.')[0])
                          : s === 'queued' ? '대기 중' : `${v.version === 1 ? '만드는 중' : '고치는 중'} ${v.progress}%`}
                    </span>
                    <span className="shrink-0 text-text-muted">{formatClock(v.created_at)}</span>
                    {s === 'completed' && !viewing && (
                      <button type="button" onClick={() => { setVersionId(v.job_id === latestDone?.job_id ? null : v.job_id); setPick(null) }}
                        className="shrink-0 rounded-full px-2 py-0.5 font-semibold text-brand hover:bg-brand-subtle">보기</button>
                    )}
                    {s === 'failed' && v.version > 1 && (
                      <button type="button" disabled={retry.isPending || !!active} onClick={() => retry.mutate(v.job_id, onError)}
                        className="shrink-0 rounded-full px-2 py-0.5 font-semibold text-brand hover:bg-brand-subtle disabled:opacity-40">재시도</button>
                    )}
                    {(s === 'running' || s === 'queued') && v.version > 1 && (
                      <button type="button" aria-label="고치기 중지" disabled={cancel.isPending} onClick={() => cancel.mutate(v.job_id, onError)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-surface-subtle"><StopIcon className="h-3 w-3" /></button>
                    )}
                  </div>
                  {s === 'running' && v.version > 1 && <ProgressBar value={v.progress} className="mx-3 mt-1" />}
                </li>
              )
            })}
          </ol>

          {/* 수정 요청 */}
          <div className="border-t border-surface-border/70 p-4">
            <div className="mb-2.5 flex flex-wrap items-center gap-2">
              <div role="radiogroup" aria-label="고칠 범위" className="relative inline-grid grid-cols-2 rounded-full bg-surface-subtle p-0.5 text-[12px]">
                <span aria-hidden="true" className="absolute bottom-0.5 left-0.5 top-0.5 w-[calc(50%-2px)] rounded-full bg-surface shadow-[0_1px_4px_rgba(0,0,0,0.08)] transition-transform duration-500 ease-[cubic-bezier(.32,.72,0,1)]"
                  style={{ transform: scope === 'all' ? 'translateX(100%)' : 'none' }} />
                {(['page', 'all'] as Scope[]).map((sc) => (
                  <button key={sc} type="button" role="radio" aria-checked={scope === sc} onClick={() => { setScope(sc); if (sc === 'all') setPick(null) }}
                    className={`relative z-10 rounded-full px-3 py-1 font-semibold transition-colors ${scope === sc ? 'text-brand' : 'text-text-secondary'}`}>
                    {sc === 'page' ? `이 ${unit}${page ? `(${index + 1})` : ''}` : '전체'}
                  </button>
                ))}
              </div>
              {scope === 'page' && pick && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[11.5px] font-bold text-white">
                  {ELEMENT_LABEL[pick]}
                  <button type="button" aria-label="고른 부분 해제" onClick={() => setPick(null)} className="rounded-full hover:bg-white/20"><XIcon className="h-3 w-3" /></button>
                </span>
              )}
              {shown && latestDone && shown.job_id !== latestDone.job_id && (
                <span className="text-[11.5px] text-text-muted">v{shown.version}을 기준으로 고칩니다</span>
              )}
            </div>
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {(pick === 'title' ? ['제목을 "새 제목"으로 바꿔 줘'] : SUGGEST[kind][scope]).map((s) => (
                <button key={s} type="button" disabled={!shown || !!active} onClick={() => { setText(s); inputRef.current?.focus() }}
                  className="rounded-full border border-surface-border px-2.5 py-1 text-[11.5px] text-text-secondary transition-[border-color,color,scale] duration-200 hover:border-brand-soft hover:text-brand active:scale-95 disabled:opacity-40">
                  {s}
                </button>
              ))}
            </div>
            <div className={`flex items-end gap-2 rounded-[20px] border bg-surface px-3 py-2 transition-colors ${active ? 'border-surface-border' : 'border-brand-soft focus-within:border-brand'}`}>
              <label htmlFor="studio-revise" className="sr-only">수정 요청</label>
              <textarea id="studio-revise" ref={inputRef} value={text} rows={2} disabled={!shown || !!active}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit() } }}
                placeholder={!shown ? '다 만들어지면 고칠 수 있습니다' : active ? '고치는 중입니다' : scope === 'all' ? '전체를 어떻게 고칠까요?' : `${index + 1}${unit}을 어떻게 고칠까요?`}
                className="min-w-0 flex-1 resize-none bg-transparent py-1 text-[13.5px] leading-relaxed text-text-primary outline-none placeholder:text-text-muted disabled:cursor-not-allowed" />
              <button type="button" aria-label="수정 요청 보내기" disabled={!text.trim() || !shown || !!active || revise.isPending} onClick={submit}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-[background-color,scale] duration-200 active:scale-90 ${text.trim() && shown && !active ? 'bg-gradient-to-br from-brand to-brand-light text-white shadow-[0_5px_13px_rgba(220,20,60,0.28)]' : 'bg-surface-subtle text-text-muted'}`}>
                {revise.isPending ? <Spinner className="h-3.5 w-3.5" /> : <ArrowUpIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {presenting && pages.length > 0 && <Present pages={pages} start={index} docTitle={docTitle} onClose={(at) => { setPresenting(false); go(at) }} />}
    </div>
  )
}

/* ───────── 발표 보기 ───────── */
function Present({ pages, start, docTitle, onClose }: { pages: DocGenPage[]; start: number; docTitle: string; onClose: (at: number) => void }) {
  const [at, setAt] = useState(start)
  const atRef = useRef(at)
  useEffect(() => { atRef.current = at })
  const move = (by: number) => setAt((i) => Math.min(pages.length - 1, Math.max(0, i + by)))

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); move(1) }
      if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); move(-1) }
      if (e.key === 'Escape') onClose(atRef.current)
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  })

  const f = FRAME.deck
  return (
    <div role="dialog" aria-modal="true" aria-label="발표 보기" className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
      <div className="relative" style={{ width: `min(100vw, calc((100vh - 64px) * ${f.w} / ${f.h}))` }}
        onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); move(e.clientX - r.left > r.width / 2 ? 1 : -1) }}>
        <div key={pages[at].page_id} className="st-pop">
          <PageView page={pages[at]} kind="deck" index={at} docTitle={docTitle} />
        </div>
      </div>
      <div className="flex h-16 items-center gap-2 text-[13px] text-white/70">
        <button type="button" aria-label="이전 장" disabled={at === 0} onClick={() => move(-1)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-30"><ChevronIcon className="h-4 w-4 rotate-90" /></button>
        <span className="min-w-16 text-center tabular-nums">{at + 1} / {pages.length}</span>
        <button type="button" aria-label="다음 장" disabled={at === pages.length - 1} onClick={() => move(1)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-30"><ChevronIcon className="h-4 w-4 -rotate-90" /></button>
      </div>
      <button type="button" aria-label="발표 보기 닫기" onClick={() => onClose(at)}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white">
        <XIcon className="h-5 w-5" />
      </button>
    </div>
  )
}
