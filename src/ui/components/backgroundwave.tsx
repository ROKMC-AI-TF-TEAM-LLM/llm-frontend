// ui/components/BackgroundWave.tsx
type WaveLayer = {
  id: string
  from: { color: string; opacity: number }
  to: { color: string; opacity: number }
  path: string
  x2?: string
}

const WAVE_LAYERS: WaveLayer[] = [
  {
    id: 'wg1',
    from: { color: '#ff4560', opacity: 0.18 },
    to:   { color: '#8b0000', opacity: 0.32 },
    path: 'M 500 0 Q 350 80 420 200 Q 480 300 350 380 Q 250 450 350 500 L 500 500 Z',
  },
  {
    id: 'wg2',
    from: { color: '#FCDCE3', opacity: 0.12 },
    to:   { color: '#FF4560', opacity: 0.22 },
    path: 'M 500 20 Q 380 100 440 220 Q 490 320 370 400 Q 280 460 370 500 L 500 500 Z',
  },
  {
    id: 'wg3',
    from: { color: '#FEF2F2', opacity: 0.10 },
    to:   { color: '#C41230', opacity: 0.15 },
    path: 'M 500 60 Q 400 130 460 250 Q 500 340 400 420 Q 320 470 400 500 L 500 500 Z',
    x2: '80%',
  },
]

const ACCENT_PATH =
  'M 500 0 Q 440 60 480 140 Q 500 200 460 260 Q 420 320 470 380 Q 490 430 460 500 L 500 500 Z'

const BackgroundWave = () => (
  <svg
    className="bg-wave pointer-events-none absolute inset-y-0 right-0 z-0 h-full w-1/2 md:w-2/5"
    viewBox="0 0 500 500"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMaxYMid slice"
    aria-hidden
  >
    <defs>
      {WAVE_LAYERS.map(({ id, from, to, x2 = '100%' }) => (
        <linearGradient key={id} id={id} x1="0%" y1="0%" x2={x2} y2="100%">
          <stop offset="0%"   stopColor={from.color} stopOpacity={from.opacity} />
          <stop offset="100%" stopColor={to.color}   stopOpacity={to.opacity} />
        </linearGradient>
      ))}
    </defs>
    {WAVE_LAYERS.map(({ id, path }) => (
      <path key={id} d={path} fill={`url(#${id})`} />
    ))}
    <path d={ACCENT_PATH} fill="rgba(224,0,27,0.08)" />
  </svg>
)

export default BackgroundWave