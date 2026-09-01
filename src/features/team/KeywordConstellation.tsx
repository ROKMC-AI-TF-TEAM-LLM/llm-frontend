import { useEffect, useRef, useState } from 'react'

type Weight = 'lg' | 'md' | 'sm'
interface Node {
  id: string
  label: string
  x: number
  y: number
  w: Weight
}

const NODES: Node[] = [
  { id: 'core', label: 'MARS', x: 48, y: 50, w: 'lg' },

  { id: 'hr', label: '인사·복지', x: 24, y: 26, w: 'lg' },
  { id: 'vac', label: '휴가·외박', x: 33, y: 8, w: 'md' },
  { id: 'ord', label: '수당', x: 7, y: 17, w: 'sm' },

  { id: 'duty', label: '복무 규정', x: 53, y: 17, w: 'md' },

  { id: 'sec', label: '정보화·보안', x: 74, y: 24, w: 'lg' },
  { id: 'gd', label: '보안 지침', x: 90, y: 11, w: 'sm' },
  { id: 'pay', label: '정보체계', x: 92, y: 33, w: 'sm' },

  { id: 'dev', label: '근거 검색', x: 79, y: 52, w: 'md' },
  { id: 'rev', label: '개정 반영', x: 95, y: 61, w: 'sm' },
  { id: 'test', label: '출처 표기', x: 91, y: 44, w: 'sm' },

  { id: 'life', label: '병영생활', x: 18, y: 51, w: 'lg' },
  { id: 'edu', label: '교육 훈련', x: 5, y: 43, w: 'sm' },
  { id: 'award', label: '포상·징계', x: 4, y: 61, w: 'sm' },

  { id: 'fin', label: '재무·법무', x: 27, y: 76, w: 'lg' },
  { id: 'bud', label: '예산 집행', x: 11, y: 88, w: 'sm' },
  { id: 'buy', label: '계약·조달', x: 34, y: 94, w: 'sm' },

  { id: 'cmd', label: '인사 명령', x: 53, y: 85, w: 'md' },

  { id: 'log', label: '군수·시설', x: 73, y: 76, w: 'md' },
  { id: 'out', label: '장비 관리', x: 88, y: 90, w: 'sm' },
]

const EDGES: [string, string][] = [
  ['core', 'hr'], ['core', 'sec'], ['core', 'life'], ['core', 'fin'],
  ['core', 'dev'], ['core', 'duty'], ['core', 'cmd'], ['core', 'log'],
  ['hr', 'vac'], ['hr', 'ord'],
  ['sec', 'gd'], ['sec', 'pay'],
  ['dev', 'rev'], ['dev', 'test'],
  ['life', 'award'], ['life', 'edu'],
  ['fin', 'bud'], ['fin', 'buy'],
  ['log', 'out'],
]

const CLS: Record<Weight, string> = {
  lg: 'text-[clamp(12px,1.25vw,15px)] font-bold text-text-primary',
  md: 'text-[clamp(11px,1.05vw,13px)] text-text-secondary',
  sm: 'text-[clamp(10px,.95vw,11.5px)] text-text-muted',
}

const DRIFT = NODES.map((n, i) => ({
  id: n.id,
  ax: n.id === 'core' ? 0 : 0.7 + (i % 4) * 0.28,
  ay: n.id === 'core' ? 0 : 0.6 + ((i * 3) % 5) * 0.26,
  sx: 0.00022 + (i % 5) * 0.00007,
  sy: 0.00018 + ((i * 2) % 6) * 0.00006,
  px: (i * 1.7) % (Math.PI * 2),
  py: (i * 2.9) % (Math.PI * 2),
}))

export default function KeywordConstellation() {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  const lineRefs = useRef<(SVGLineElement | null)[]>([])
  const labelRefs = useRef<Record<string, HTMLSpanElement | null>>({})

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!shown) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const pos: Record<string, { x: number; y: number }> = {}
    let raf = 0

    const tick = (t: number) => {
      for (let i = 0; i < DRIFT.length; i++) {
        const d = DRIFT[i]
        const n = NODES[i]
        pos[d.id] = {
          x: n.x + Math.sin(t * d.sx + d.px) * d.ax,
          y: n.y + Math.cos(t * d.sy + d.py) * d.ay,
        }
      }

      for (let i = 0; i < EDGES.length; i++) {
        const ln = lineRefs.current[i]
        if (!ln) continue
        const a = pos[EDGES[i][0]]
        const b = pos[EDGES[i][1]]
        ln.setAttribute('x1', String(a.x))
        ln.setAttribute('y1', String(a.y))
        ln.setAttribute('x2', String(b.x))
        ln.setAttribute('y2', String(b.y))
      }

      for (let i = 0; i < NODES.length; i++) {
        const n = NODES[i]
        if (n.id === 'core') continue
        const el = labelRefs.current[n.id]
        if (!el) continue
        const p = pos[n.id]
        const dxPct = ((p.x - n.x) / 100) * (ref.current?.clientWidth ?? 0)
        const dyPct = ((p.y - n.y) / 100) * (ref.current?.clientHeight ?? 0)
        el.style.transform = `translate(calc(-50% + ${dxPct}px), calc(-50% + ${dyPct}px))`
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [shown])

  return (
    <div ref={ref} className="relative aspect-[5/4] w-full">
      <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {EDGES.map(([a, b], i) => {
          const na = NODES.find((n) => n.id === a)!
          const nb = NODES.find((n) => n.id === b)!
          const fromCore = a === 'core'
          return (
            <line
              key={i}
              ref={(el) => {
                lineRefs.current[i] = el
              }}
              x1={na.x}
              y1={na.y}
              x2={nb.x}
              y2={nb.y}
              stroke="#DC143C"
              strokeWidth={fromCore ? 0.11 : 0.08}
              opacity={shown ? (fromCore ? 0.3 : 0.2) : 0}
              style={{ transition: `opacity .8s ease ${(fromCore ? 0 : 0.3) + i * 0.04}s` }}
            />
          )
        })}
      </svg>

      {NODES.map((n, i) => {
        if (n.id === 'core') {
          return (
            <span
              key={n.id}
              className="mars-brand-serif absolute z-[2] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[clamp(22px,2.8vw,33px)] font-black tracking-tight text-brand"
              style={{
                left: `${n.x}%`,
                top: `${n.y}%`,
                opacity: shown ? 1 : 0,
                transition: 'opacity .6s ease .15s',
              }}
            >
              MARS
            </span>
          )
        }
        return (
          <span
            key={n.id}
            ref={(el) => {
              labelRefs.current[n.id] = el
            }}
            className={`absolute whitespace-nowrap break-keep ${CLS[n.w]}`}
            style={{
              left: `${n.x}%`,
              top: `${n.y}%`,
              transform: 'translate(-50%, -50%)',
              opacity: shown ? 1 : 0,
              transition: `opacity .6s ease ${0.2 + i * 0.035}s`,
              textShadow: '0 0 8px #fff, 0 0 8px #fff, 0 0 8px #fff',
              willChange: 'transform',
            }}
          >
            {n.label}
          </span>
        )
      })}
    </div>
  )
}
