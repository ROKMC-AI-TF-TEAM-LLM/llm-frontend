// 문서 스튜디오 조각: 종류 전환, 개요 편집, 작업 카드
import type { CSSProperties } from 'react'
import type { DocGenKind, DocGenOutlineItem, DocGenPageLayout } from '../../types/docgen'
import { KIND_LABEL, formatClock, normalizeJobStatus } from '../../utils/docgen'
import { Picker, Spinner, StatusDot } from '../docgen/components'
import { ArrowUpIcon, ChevronIcon, RetryIcon, XIcon } from '../docgen/icons'
import { PageSkeleton, PageView } from './PageView'
import type { StudioComposer, useStudioWorks } from './hooks'

const KINDS: DocGenKind[] = ['deck', 'doc']

/** 발표 자료 / 문서 전환. 고른 쪽으로 바탕이 미끄러진다 */
export function KindSwitch({ value, onChange, disabled = false }: { value: DocGenKind; onChange: (k: DocGenKind) => void; disabled?: boolean }) {
  const at = KINDS.indexOf(value)
  return (
    <div role="radiogroup" aria-label="만들 종류" className="relative inline-grid grid-cols-2 rounded-full bg-surface-subtle p-1">
      <span aria-hidden="true" className="absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-full bg-surface shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform duration-500 ease-[cubic-bezier(.32,.72,0,1)]"
        style={{ transform: `translateX(${at * 100}%)` }} />
      {KINDS.map((k) => (
        <button key={k} type="button" role="radio" aria-checked={value === k} disabled={disabled} onClick={() => onChange(k)}
          className={`relative z-10 rounded-full px-5 py-1.5 text-[13px] font-semibold transition-colors duration-300 ${value === k ? 'text-brand' : 'text-text-secondary hover:text-text-primary'}`}>
          {KIND_LABEL[k].name}
        </button>
      ))}
    </div>
  )
}

/* ───────── 개요 편집 ───────── */
const LAYOUTS: { value: DocGenPageLayout; label: string }[] = [
  { value: 'bullets', label: '글머리표' },
  { value: 'two-column', label: '두 단' },
  { value: 'table', label: '표' },
  { value: 'chart', label: '그래프' },
]

const iconBtn = 'flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-[background-color,color,scale] duration-200 hover:bg-surface-subtle hover:text-text-primary active:scale-90 disabled:pointer-events-none disabled:opacity-30'

/** 만들기 전에 쪽·장 구성을 확인하고 고친다. 항목 하나 = 만들어질 쪽 하나 */
export function OutlineEditor({ c, onBuild }: { c: StudioComposer; onBuild: () => void }) {
  const { outline, kind } = c
  const unit = KIND_LABEL[kind].unit

  if (!outline)
    return (
      <div aria-busy="true" className="flex flex-col gap-3 p-5 sm:p-6">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-text-secondary"><Spinner className="h-3 w-3 text-brand" /> 개요를 짜는 중입니다</p>
        {[0, 1, 2, 3].map((i) => <span key={i} className="st-shimmer h-[52px] rounded-2xl" style={{ opacity: 1 - i * 0.18 }} />)}
      </div>
    )

  const items = outline.items
  const setItems = (next: DocGenOutlineItem[]) => c.setOutline({ ...outline, items: next })
  const patch = (i: number, part: Partial<DocGenOutlineItem>) => setItems(items.map((it, j) => (j === i ? { ...it, ...part } : it)))
  const move = (i: number, by: number) => {
    const next = [...items]
    const [it] = next.splice(i, 1)
    next.splice(i + by, 0, it)
    setItems(next)
  }
  const add = () => setItems([...items, { title: '', points: [], layout: kind === 'deck' ? 'bullets' : null }])

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-surface-border/70 px-5 py-4 sm:px-6">
        <p className="text-[13px] font-semibold text-text-primary">개요 확인</p>
        <span className="text-[12px] text-text-muted">{kind === 'deck' ? `표지 + ${items.length}${unit}` : `${items.length}개 항목`} · 순서를 바꾸거나 고친 뒤 만드세요</span>
      </div>

      <div className="flex flex-col gap-1 px-3 py-3 sm:px-4">
        <label className="flex items-center gap-3 rounded-2xl px-2 py-2">
          <span className="w-12 shrink-0 text-[11.5px] font-semibold text-text-muted">제목</span>
          <input value={outline.title} onChange={(e) => c.setOutline({ ...outline, title: e.target.value })}
            className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1 text-[15px] font-bold text-text-primary outline-none transition-colors focus:bg-surface-card1" />
        </label>

        <ol className="flex flex-col gap-1">
          {items.map((it, i) => (
            <li key={i} className="st-rise group flex gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-surface-card1 focus-within:bg-surface-card1" style={{ '--d': `${i * 60}ms` } as CSSProperties}>
              <span className="mt-1.5 flex h-6 w-12 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-[11.5px] font-bold tabular-nums text-brand">
                {kind === 'deck' ? `${i + 2}${unit}` : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <input aria-label={`${i + 1}번째 제목`} value={it.title} placeholder="제목" onChange={(e) => patch(i, { title: e.target.value })}
                  className="w-full rounded-lg bg-transparent px-2 py-1 text-[14px] font-semibold text-text-primary outline-none placeholder:text-text-muted focus:bg-surface" />
                <textarea aria-label={`${i + 1}번째 내용`} value={it.points.join('\n')} rows={Math.max(2, it.points.length)} placeholder="담을 내용 (한 줄에 하나)"
                  onChange={(e) => patch(i, { points: e.target.value.split('\n') })}
                  className="mt-0.5 w-full resize-none rounded-lg bg-transparent px-2 py-1 text-[12.5px] leading-relaxed text-text-secondary outline-none field-sizing-content placeholder:text-text-muted focus:bg-surface" />
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-start">
                {kind === 'deck' && (
                  <Picker label="배치" value={it.layout ?? 'bullets'} options={LAYOUTS} onChange={(v) => patch(i, { layout: v as DocGenPageLayout })} />
                )}
                <div className="flex lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                  <button type="button" aria-label="위로" disabled={i === 0} onClick={() => move(i, -1)} className={iconBtn}><ChevronIcon className="h-4 w-4 rotate-180" /></button>
                  <button type="button" aria-label="아래로" disabled={i === items.length - 1} onClick={() => move(i, 1)} className={iconBtn}><ChevronIcon className="h-4 w-4" /></button>
                  <button type="button" aria-label="빼기" disabled={items.length <= 1} onClick={() => setItems(items.filter((_, j) => j !== i))} className={iconBtn}><XIcon className="h-4 w-4" /></button>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <button type="button" onClick={add}
          className="mx-2 mt-1 rounded-2xl border border-dashed border-surface-border py-2.5 text-[12.5px] font-semibold text-text-secondary transition-colors hover:border-brand-soft hover:text-brand">
          + {kind === 'deck' ? '장' : '항목'} 추가
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-surface-border/70 px-5 py-4 sm:px-6">
        <button type="button" disabled={c.outlining || c.building} onClick={() => c.requestOutline()}
          className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold text-text-secondary transition-[background-color,scale] duration-200 hover:bg-surface-subtle active:scale-[.97] disabled:opacity-50">
          <RetryIcon className="h-3.5 w-3.5" /> 다시 짜기
        </button>
        <button type="button" disabled={c.building || !items.some((it) => it.title.trim())} onClick={onBuild}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand px-5 text-[13.5px] font-bold text-white shadow-[0_6px_16px_rgba(220,20,60,0.25)] transition-[background-color,scale] duration-200 hover:bg-brand-hover active:scale-[.96] disabled:opacity-60">
          {c.building ? <Spinner className="h-3.5 w-3.5" /> : <ArrowUpIcon className="h-4 w-4 rotate-90" />} 이대로 만들기
        </button>
      </div>
    </div>
  )
}

/* ───────── 작업 카드 (스튜디오 홈) ───────── */
type Work = ReturnType<typeof useStudioWorks>['works'][number]

/** 문서 한 건. 다 만들어진 마지막 버전의 첫 쪽을 표지로 보여 준다 */
export function WorkCard({ work, onOpen, onDelete, delay = 0 }: { work: Work; onOpen: () => void; onDelete: () => void; delay?: number }) {
  const { root, latest, latestDone, count } = work
  const s = normalizeJobStatus(latest.status)
  const page = latestDone?.result?.pages[0]
  const unit = KIND_LABEL[root.kind].unit
  const status =
    s === 'running' ? `${latest.version > 1 ? '고치는 중' : '만드는 중'} ${latest.progress}%`
      : s === 'queued' ? '대기 중'
        : latestDone ? `v${latestDone.version} · ${latestDone.result?.page_count ?? 0}${unit}`
          : latest.error?.code === 'CANCELLED' ? '취소됨' : '만들지 못함'
  return (
    <li className="st-rise group relative" style={{ '--d': `${delay}ms` } as CSSProperties}>
      <button type="button" onClick={onOpen}
        className="flex w-full flex-col overflow-hidden rounded-[20px] bg-surface text-left shadow-[0_0_0_1px_var(--color-surface-border)] transition-[box-shadow,translate] duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_var(--color-surface-border),0_18px_40px_-16px_rgba(0,0,0,0.18)]">
        <div className="relative aspect-[16/10] overflow-hidden border-b border-surface-border/70 bg-surface-card1 p-3">
          <div className="overflow-hidden rounded-lg shadow-[0_0_0_1px_var(--color-surface-border)]">
            {page ? <PageView page={page} kind={root.kind} index={0} docTitle={latestDone?.title ?? root.title} /> : <PageSkeleton kind={root.kind} />}
          </div>
        </div>
        <div className="flex flex-col gap-1 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="shrink-0 rounded-full bg-surface-subtle px-2 py-0.5 text-[10.5px] font-bold text-text-secondary">{KIND_LABEL[root.kind].name}</span>
            <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-text-primary">{latestDone?.title ?? root.title}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11.5px] text-text-muted">
            <StatusDot job={latestDone && s !== 'running' && s !== 'queued' ? latestDone : latest} />
            <span className="tabular-nums">{status}</span>
            <span>·</span>
            <span>{count > 1 ? `수정 ${count - 1}번` : root.template_name}</span>
            <span className="flex-1" />
            <span>{formatClock(latest.created_at)}</span>
          </div>
        </div>
      </button>
      <button type="button" aria-label={`${root.title} 지우기`} onClick={onDelete}
        className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-text-muted shadow-[0_0_0_1px_var(--color-surface-border)] backdrop-blur transition-[opacity,color,scale] duration-200 hover:text-status-error active:scale-90 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100">
        <XIcon className="h-4 w-4" />
      </button>
    </li>
  )
}
