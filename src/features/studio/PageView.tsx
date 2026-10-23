// 쪽·장 그리기. 발표 자료는 16:9 장, 문서는 A4 쪽으로 그린다.
// 실제 크기(px)로 그린 뒤 감싼 상자 너비에 맞춰 줄이므로 썸네일·캔버스·발표 보기가 같은 그림을 쓴다.
import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { DocGenChart, DocGenKind, DocGenPage, DocGenPageElement, DocGenTable } from '../../types/docgen'
import { ELEMENT_LABEL, FRAME } from './constants'

/** 상자 너비에 맞춰 줄일 비율 */
function useFitScale(baseW: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setScale(el.clientWidth / baseW)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [baseW])
  return { ref, scale }
}

/** 실제 크기로 그린 내용을 상자에 맞춰 줄여 담는다 */
function Fit({ kind, className = '', children }: { kind: DocGenKind; className?: string; children: ReactNode }) {
  const f = FRAME[kind]
  const { ref, scale } = useFitScale(f.w)
  return (
    <div ref={ref} className={`relative w-full overflow-hidden ${className}`} style={{ aspectRatio: `${f.w} / ${f.h}` }}>
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: f.w, height: f.h, transform: `scale(${scale})`, visibility: scale ? 'visible' : 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

/* ───────── 고를 수 있는 부분 ───────── */
interface PickProps {
  pick?: DocGenPageElement | null
  /** 있으면 부분을 눌러 고를 수 있다 */
  onPick?: (el: DocGenPageElement) => void
}

function Part({ el, pick, onPick, className = '', children }: PickProps & { el: DocGenPageElement; className?: string; children: ReactNode }) {
  if (!onPick) return <div className={className}>{children}</div>
  const on = pick === el
  const choose = () => onPick(el)
  return (
    <div role="button" tabIndex={0} aria-pressed={on} aria-label={`${ELEMENT_LABEL[el]} 고르기`}
      onClick={(e) => { e.stopPropagation(); choose() }}
      onKeyDown={(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); choose() } }}
      className={`relative cursor-pointer rounded-xl outline-2 outline-offset-[10px] transition-[outline-color] duration-200 ${on ? 'outline-brand' : 'outline-transparent hover:outline-brand/35'} ${className}`}>
      {/* 이름표는 오른쪽 위에 둔다. 왼쪽 정렬된 글과 겹치지 않도록 */}
      {on && <span className="absolute -top-[44px] right-0 rounded-lg bg-brand px-3 py-1 text-[15px] font-bold text-white">{ELEMENT_LABEL[el]}</span>}
      {children}
    </div>
  )
}

/* ───────── 공통 조각 ───────── */
function Table({ table, size }: { table: DocGenTable; size: 'deck' | 'doc' }) {
  const cell = size === 'deck' ? 'px-5 py-3 text-[18px]' : 'px-3 py-2 text-[14px]'
  return (
    <table className="w-full border-collapse overflow-hidden rounded-xl text-left">
      <thead>
        <tr>{table.columns.map((c) => <th key={c} className={`${cell} bg-brand-subtle font-bold text-brand`}>{c}</th>)}</tr>
      </thead>
      <tbody>
        {table.rows.map((row, i) => (
          <tr key={i} className="border-b border-surface-border">
            {row.map((v, j) => <td key={j} className={`${cell} ${j === 0 ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>{v}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Chart({ chart, size }: { chart: DocGenChart; size: 'deck' | 'doc' }) {
  const max = Math.max(100, ...chart.data.map((d) => d.value))
  const h = size === 'deck' ? 260 : 220
  return (
    <div className="flex items-end justify-around gap-6 border-b-2 border-surface-border px-4" style={{ height: h + 40 }}>
      {chart.data.map((d) => (
        <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <span className={`font-bold tabular-nums text-text-primary ${size === 'deck' ? 'text-[20px]' : 'text-[15px]'}`}>{d.value}{chart.unit}</span>
          <span className="w-full max-w-[96px] rounded-t-lg bg-gradient-to-t from-brand to-brand-light" style={{ height: (d.value / max) * h }} />
          <span className={`w-full truncate text-center text-text-secondary ${size === 'deck' ? 'text-[15px]' : 'text-[12px]'}`}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

/** 제목 아래 본문 영역 (배치별) */
function Content({ page, size, pick, onPick }: PickProps & { page: DocGenPage; size: 'deck' | 'doc' }) {
  const deck = size === 'deck'
  const bullet = deck ? 'text-[22px] leading-snug' : 'text-[15px] leading-relaxed'
  const list = (items: string[], small = false) => (
    <ul className={`flex flex-col ${deck ? 'gap-4' : 'gap-1.5'}`}>
      {items.map((b, i) => (
        <li key={i} className={`flex gap-3 text-text-primary ${small ? (deck ? 'text-[18px]' : 'text-[14px]') : bullet}`}>
          <span className={`shrink-0 rounded-full bg-brand ${deck ? 'mt-[0.55em] h-2 w-2' : 'mt-[0.6em] h-1.5 w-1.5'}`} />
          <span>{b}</span>
        </li>
      ))}
    </ul>
  )
  if (page.layout === 'table' && page.table) return <Part el="table" pick={pick} onPick={onPick}><Table table={page.table} size={size} /></Part>
  if (page.layout === 'chart' && page.chart) return <Part el="chart" pick={pick} onPick={onPick}><Chart chart={page.chart} size={size} /></Part>
  if (page.layout === 'two-column')
    return (
      <Part el="columns" pick={pick} onPick={onPick} className={`grid grid-cols-2 ${deck ? 'gap-7' : 'gap-4'}`}>
        {page.columns.map((col) => (
          <div key={col.heading} className={`rounded-2xl bg-surface-card1 ${deck ? 'p-7' : 'p-4'}`}>
            <p className={`font-bold text-brand ${deck ? 'mb-4 text-[20px]' : 'mb-2 text-[15px]'}`}>{col.heading}</p>
            {list(col.bullets, true)}
          </div>
        ))}
      </Part>
    )
  return (
    <div className={`flex flex-col ${deck ? 'gap-5' : 'gap-3'}`}>
      {page.body && <Part el="body" pick={pick} onPick={onPick}><p className="text-[15px] leading-[1.8] text-text-secondary">{page.body}</p></Part>}
      {page.bullets.length > 0 && <Part el="bullets" pick={pick} onPick={onPick}>{list(page.bullets)}</Part>}
    </div>
  )
}

/* ───────── 발표 자료 한 장 ───────── */
function Slide({ page, index, docTitle, pick, onPick }: PickProps & { page: DocGenPage; index: number; docTitle: string }) {
  if (page.layout === 'cover')
    return (
      <div className="relative flex h-full flex-col justify-center bg-surface px-20">
        <span className="absolute left-0 top-0 h-full w-3 bg-gradient-to-b from-brand to-brand-light" />
        <span className="mb-8 h-1.5 w-16 rounded-full bg-brand" />
        <Part el="title" pick={pick} onPick={onPick}><h2 className="text-[52px] font-bold leading-tight text-text-primary">{page.title}</h2></Part>
        {page.subtitle && <Part el="subtitle" pick={pick} onPick={onPick} className="mt-6"><p className="text-[22px] text-text-secondary">{page.subtitle}</p></Part>}
      </div>
    )
  return (
    <div className="relative flex h-full flex-col bg-surface px-16 pb-14 pt-12">
      <span className="mb-4 h-1.5 w-12 rounded-full bg-brand" />
      <Part el="title" pick={pick} onPick={onPick}><h2 className="text-[36px] font-bold leading-tight text-text-primary">{page.title}</h2></Part>
      <div className="mt-9 min-h-0 flex-1"><Content page={page} size="deck" pick={pick} onPick={onPick} /></div>
      <span className="absolute bottom-6 left-16 max-w-[60%] truncate text-[13px] text-text-muted">{docTitle}</span>
      <span className="absolute bottom-6 right-16 text-[14px] font-semibold tabular-nums text-text-muted">{index + 1}</span>
    </div>
  )
}

/* ───────── 문서 한 쪽 ───────── */
function Sheet({ page, index, docTitle, pick, onPick }: PickProps & { page: DocGenPage; index: number; docTitle: string }) {
  return (
    <div className="relative flex h-full flex-col bg-surface px-[72px] pb-20 pt-20">
      {index === 0 && (
        <header className="mb-10 border-b-2 border-text-primary pb-6 text-center">
          <h1 className="text-[28px] font-bold text-text-primary">{docTitle}</h1>
        </header>
      )}
      <Part el="title" pick={pick} onPick={onPick}><h2 className="text-[20px] font-bold text-text-primary">{index + 1}. {page.title}</h2></Part>
      <div className="mt-4"><Content page={page} size="doc" pick={pick} onPick={onPick} /></div>
      <span className="absolute bottom-8 left-0 w-full text-center text-[12px] tabular-nums text-text-muted">- {index + 1} -</span>
    </div>
  )
}

export function PageView({ page, kind, index, docTitle, pick, onPick, className = '' }: PickProps & {
  page: DocGenPage; kind: DocGenKind; index: number; docTitle: string; className?: string
}) {
  return (
    <Fit kind={kind} className={className}>
      {kind === 'deck'
        ? <Slide page={page} index={index} docTitle={docTitle} pick={pick} onPick={onPick} />
        : <Sheet page={page} index={index} docTitle={docTitle} pick={pick} onPick={onPick} />}
    </Fit>
  )
}

/** 아직 만들어지지 않은 쪽. 개요 제목을 알면 흐리게 보여 준다 */
export function PageSkeleton({ kind, title, className = '' }: { kind: DocGenKind; title?: string; className?: string }) {
  const deck = kind === 'deck'
  return (
    <Fit kind={kind} className={className}>
      <div className={`flex h-full flex-col bg-surface ${deck ? 'px-16 pt-12' : 'px-[72px] pt-20'}`}>
        <span className="mb-4 h-1.5 w-12 rounded-full bg-surface-subtle" />
        {title
          ? <p className={`font-bold text-text-hint ${deck ? 'text-[36px]' : 'text-[20px]'}`}>{title}</p>
          : <span className="st-shimmer h-9 w-1/2 rounded-lg" />}
        <div className={`flex flex-col ${deck ? 'mt-10 gap-5' : 'mt-6 gap-3'}`}>
          {['80%', '64%', '72%', '48%'].map((w) => <span key={w} className={`st-shimmer rounded-md ${deck ? 'h-6' : 'h-3.5'}`} style={{ width: w }} />)}
        </div>
      </div>
    </Fit>
  )
}
