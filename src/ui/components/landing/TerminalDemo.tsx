import { useEffect, useMemo, useRef, useState } from 'react'

type Seg =
  | { t: 'lv'; v: 'INFO' | 'DEBUG' }
  | { t: 'ts'; v: string }
  | { t: 'log'; v: string }
  | { t: 'txt'; v: string }
  | { t: 'hl'; v: string }
  | { t: 'ok'; v: string }
  | { t: 'req'; v: string }

type Row = { segs: Seg[]; delay: number }

const ts = (v: string): Seg => ({ t: 'ts', v: `[${v}]` })

const SCRIPT: Row[] = [
  { segs: [ts('09:51:11.613'), { t: 'lv', v: 'INFO' }, { t: 'log', v: 'main:' }, { t: 'txt', v: '질의 수신: dept=(없음), domain=(전체), tool=(자동), 이력 0턴, 질문=' }, { t: 'hl', v: '정기휴가 신청 절차' }], delay: 620 },
  { segs: [ts('09:51:11.702'), { t: 'lv', v: 'DEBUG' }, { t: 'log', v: 'openai._base_client:' }, { t: 'txt', v: 'Sending HTTP Request: POST http://localhost:8000/v1/chat/completions' }], delay: 420 },
  { segs: [ts('09:51:12.878'), { t: 'lv', v: 'INFO' }, { t: 'log', v: 'ax_rag.query_graph.nodes.router:' }, { t: 'txt', v: '라우팅: 계획=' }, { t: 'hl', v: "['DOC_SEARCH']" }, { t: 'txt', v: ', rewritten=정기휴가 신청 절차' }], delay: 560 },
  { segs: [ts('09:51:13.104'), { t: 'lv', v: 'INFO' }, { t: 'log', v: 'ax_rag.retriever:' }, { t: 'txt', v: '벡터 검색 → 상위 ' }, { t: 'hl', v: '4건' }, { t: 'txt', v: ' 회수 (domain=전체, k=8)' }], delay: 520 },
  { segs: [{ t: 'lv', v: 'INFO' }, { t: 'txt', v: '     127.0.0.1:49214 - ' }, { t: 'req', v: '"GET /documents?offset=0&limit=100 HTTP/1.1"' }, { t: 'ok', v: '200 OK' }], delay: 480 },
  { segs: [ts('09:51:13.660'), { t: 'lv', v: 'INFO' }, { t: 'log', v: 'ax_rag.reranker:' }, { t: 'txt', v: '재순위화 완료 → 군인복무기본법.pdf ' }, { t: 'hl', v: 'p.42 (score 0.91)' }], delay: 560 },
  { segs: [ts('09:51:19.058'), { t: 'lv', v: 'DEBUG' }, { t: 'log', v: 'httpx:' }, { t: 'txt', v: 'HTTP Request: POST http://localhost:8000/v1/chat/completions ' }, { t: 'ok', v: '"HTTP/1.1 200 OK"' }], delay: 440 },
  { segs: [ts('09:51:19.070'), { t: 'lv', v: 'DEBUG' }, { t: 'log', v: 'main:' }, { t: 'txt', v: 'SSE 스트리밍 시작: text 4조각, sources ' }, { t: 'hl', v: '1건' }], delay: 500 },
  { segs: [ts('09:51:19.070'), { t: 'lv', v: 'DEBUG' }, { t: 'log', v: 'main:' }, { t: 'txt', v: 'SSE text [1/4] (18자): ' }, { t: 'hl', v: '정기휴가는 연 21일이며,' }], delay: 300 },
  { segs: [ts('09:51:19.276'), { t: 'lv', v: 'DEBUG' }, { t: 'log', v: 'main:' }, { t: 'txt', v: 'SSE text [2/4] (24자): ' }, { t: 'hl', v: '부대 사정에 따라 분할 사용이' }], delay: 300 },
  { segs: [ts('09:51:19.480'), { t: 'lv', v: 'DEBUG' }, { t: 'log', v: 'main:' }, { t: 'txt', v: 'SSE text [3/4] (12자): ' }, { t: 'hl', v: '가능합니다.' }], delay: 300 },
  { segs: [ts('09:51:19.683'), { t: 'lv', v: 'DEBUG' }, { t: 'log', v: 'main:' }, { t: 'txt', v: 'SSE text [4/4] (31자): ' }, { t: 'hl', v: '근거: 군인복무기본법 제18조 ①항' }], delay: 340 },
  { segs: [ts('09:51:19.887'), { t: 'lv', v: 'DEBUG' }, { t: 'log', v: 'main:' }, { t: 'txt', v: "SSE sources: ['군인복무기본법.pdf#p42']" }], delay: 300 },
  { segs: [ts('09:51:19.889'), { t: 'lv', v: 'DEBUG' }, { t: 'log', v: 'main:' }, { t: 'txt', v: 'SSE ' }, { t: 'ok', v: 'done' }], delay: 420 },
  { segs: [{ t: 'lv', v: 'INFO' }, { t: 'txt', v: '     127.0.0.1:49216 - ' }, { t: 'req', v: '"POST /query HTTP/1.1"' }, { t: 'ok', v: '200 OK' }], delay: 1400 },
]

const TOTAL = SCRIPT.length
const HOLD_MS = 2800

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function TerminalDemo({ className = '' }: { className?: string }) {
  const reduced = useMemo(() => prefersReduced(), [])
  const [shown, setShown] = useState(() => (prefersReduced() ? TOTAL : 0))
  const rootRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!active || reduced) return
    const wait = shown >= TOTAL ? HOLD_MS : SCRIPT[shown].delay
    const id = setTimeout(() => setShown((n) => (n >= TOTAL ? 0 : n + 1)), wait)
    return () => clearTimeout(id)
  }, [shown, active, reduced])

  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [shown])

  return (
    <div ref={rootRef} className={`mars-term ${className}`}>
      <div className="mars-term-bar">
        <span className="mars-term-dot" style={{ background: '#ff5f57' }} />
        <span className="mars-term-dot" style={{ background: '#febc2e' }} />
        <span className="mars-term-dot" style={{ background: '#28c840' }} />
      </div>

      <div ref={bodyRef} className="mars-term-body scrollbar-hide">
        <div className="mars-term-line mars-term-prompt">
          <span className="s-venv">(.venv)</span>{' '}
          <span className="s-path">PS C:\Users\User\Desktop\project\mars-ai-server&gt;</span>{' '}
          <span className="s-cmd">python -m uvicorn main:app --host 0.0.0.0 --port 9000</span>
        </div>

        {SCRIPT.slice(0, shown).map((row, i) => (
          <div key={i} className="mars-term-line">
            {row.segs.map((s, j) => (
              <span key={j} className={segClass(s)}>
                {s.t === 'lv' ? `${s.v}:` : s.v}
                {needsSpace(s) ? ' ' : ''}
              </span>
            ))}
          </div>
        ))}

        {shown < TOTAL && <span className="mars-term-caret" />}
      </div>
    </div>
  )
}

function segClass(s: Seg) {
  switch (s.t) {
    case 'lv':  return s.v === 'INFO' ? 's-info' : 's-debug'
    case 'ts':  return 's-ts'
    case 'log': return 's-logger'
    case 'hl':  return 's-hl'
    case 'ok':  return 's-ok'
    case 'req': return 's-req'
    default:    return ''
  }
}

function needsSpace(s: Seg) {
  return s.t === 'lv' || s.t === 'ts' || s.t === 'log' || s.t === 'req'
}
