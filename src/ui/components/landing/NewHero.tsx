import { useNavigate } from 'react-router-dom'
import { showDevToast } from '../DevToast'

const STAR_COLORS = ['#ffffff', '#ffe1e6', '#ffd0d8', '#ffc2cd', '#e9d5ff', '#d6e4ff', '#fff0d6']
const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}
const STARS = Array.from({ length: 150 }, (_, i) => {
  const rx = rand(i + 1)
  const ry = rand(i + 91)
  const rr = rand(i + 191)
  const rc = rand(i + 291)
  const rt = rand(i + 391)
  return {
    x: rx * 1000,
    y: ry * 700,
    r: 0.5 + rr * rr * 1.9,
    color: STAR_COLORS[Math.floor(rc * STAR_COLORS.length)],
    twinkle: rt > 0.72,
    delay: rt * 4,
  }
})

const DUST = Array.from({ length: 260 }, (_, i) => {
  const rt = rand(i + 811)
  return {
    x: rand(i + 511) * 1000,
    y: rand(i + 611) * 700,
    r: 0.3 + rand(i + 711) * 0.7,
    twinkle: rt > 0.55,
    delay: rt * 5,
  }
})

const RED_DUST = Array.from({ length: 200 }, (_, i) => {
  const rt = rand(i + 1211)
  return {
    x: rand(i + 911) * 1000,
    y: rand(i + 1011) * 700,
    r: 0.3 + rand(i + 1111) * 0.8,
    twinkle: rt > 0.6,
    delay: rt * 5,
  }
})

const CLUSTERS: [number, number, number][] = [
  [820, 150, 90], [180, 470, 76], [560, 600, 64],
]
const CLUSTER_STARS = CLUSTERS.flatMap(([cx, cy, rad], ci) =>
  Array.from({ length: 26 }, (_, j) => {
    const a = rand(ci * 100 + j + 7) * Math.PI * 2
    const dist = Math.pow(rand(ci * 100 + j + 57), 1.6) * rad
    return {
      x: cx + Math.cos(a) * dist,
      y: cy + Math.sin(a) * dist,
      r: 0.4 + rand(ci * 100 + j + 107) * 1,
      color: STAR_COLORS[Math.floor(rand(ci * 100 + j + 157) * STAR_COLORS.length)],
    }
  }),
)

export default function NewHero({
  view,
  openAuth,
}: {
  view: 'intro' | 'auth'
  openAuth: () => void
}) {
  const navigate = useNavigate()

  return (
    <section className="mars-newhero mars-section relative flex min-h-screen items-center overflow-hidden px-[7vw]">
      <div className="mars-nebula" aria-hidden>
        <span className="neb n1" />
        <span className="neb n2" />
        <span className="neb n3" />
      </div>

      <svg className="mars-sky" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" aria-hidden xmlns="http://www.w3.org/2000/svg">
        {CLUSTERS.map(([cx, cy, rad], i) => (
          <circle key={`cg${i}`} cx={cx} cy={cy} r={rad} className="sky-cluster-glow" />
        ))}
        {CLUSTER_STARS.map((s, i) => (
          <circle key={`c${i}`} cx={s.x} cy={s.y} r={s.r} fill={s.color} className="sky-clusterstar" />
        ))}
        {DUST.map((s, i) => (
          <circle
            key={`u${i}`}
            cx={s.x} cy={s.y} r={s.r} fill="#ffffff"
            className={s.twinkle ? 'sky-dust sky-tw' : 'sky-dust'}
            style={s.twinkle ? { animationDelay: `${s.delay}s` } : undefined}
          />
        ))}
        {RED_DUST.map((s, i) => (
          <circle
            key={`r${i}`}
            cx={s.x} cy={s.y} r={s.r} fill="#e84a68"
            className={s.twinkle ? 'sky-reddust sky-tw' : 'sky-reddust'}
            style={s.twinkle ? { animationDelay: `${s.delay}s` } : undefined}
          />
        ))}
        {STARS.map((s, i) => (
          <circle
            key={`s${i}`}
            cx={s.x} cy={s.y} r={s.r} fill={s.color}
            className={s.twinkle ? 'sky-star sky-tw' : 'sky-star'}
            style={s.twinkle ? { animationDelay: `${s.delay}s` } : undefined}
          />
        ))}
      </svg>

      <div className="mars-shooting" aria-hidden>
        <span className="shoot s1" />
        <span className="shoot s2" />
        <span className="shoot s3" />
      </div>

      <div className="mars-hn-copy">
        <p className="mars-eyebrow"><span>Marine Artificial Intelligence Reasoning System</span></p>
        <h1 className="mars-hn-word">MARS</h1>
        <p className="mars-hn-title">
          해병대의 <span className="mars-hn-em">모든 규정</span>을,<br />
          한 번에 <span className="mars-hn-accent">확인하세요</span>
        </p>
        <p className="mars-hn-sub">법령·규정·규칙을 참조해<br className="hn-br" />장병의 질문에 근거와 함께 답합니다.</p>

        <div className="mars-hn-actions">
          {view === 'intro' ? (
            <button onClick={openAuth} className="mars-hn-cta">
              MARS 시작하기 <span aria-hidden>→</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => showDevToast('개발 중인 페이지입니다.')} className="mars-hn-ghost">팀 소개</button>
              <button type="button" onClick={() => navigate('/guide')} className="mars-hn-ghost">서비스 이용법</button>
            </div>
          )}
        </div>
      </div>

      <div className="mars-hn-art" aria-hidden>
        <div className="mars-planetwrap">
          <div className="mars-orbit-ring r1" />
          <div className="mars-orbit-ring r2" />
          <div className="mars-planet3d">
            <div className="mars-planet3d-glow" />
          </div>
          <div className="mars-orbit-dot d1"><span /></div>
          <div className="mars-orbit-dot d2"><span /></div>
        </div>
      </div>
    </section>
  )
}
