import AnchorMark from '../AnchorMark'
import EmblemLines from '../EmblemLines'
import { HERO } from '../teamContent'
import Placeholder from './Placeholder'

export default function TeamHero() {
  return (
    <section className="relative flex min-h-[calc(100vh-66px)] items-center overflow-hidden px-[6vw] py-20">
      <div className="mars-glow-bg" style={{ width: 640, height: 640, right: '-8%', top: '-6%' }} />

      <AnchorMark
        size={560}
        angle={-12}
        opacity={0.045}
        className="pointer-events-none absolute -right-20 bottom-[-8%]"
      />

      <div className="relative z-[1] mx-auto grid w-full max-w-[1180px] items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <p className="mars-reveal flex items-center gap-2.5 text-[12.5px] font-bold tracking-[0.22em] text-brand">
            <span className="h-px w-8 bg-brand/45" />
            {HERO.eyebrow}
          </p>

          <h1
            className="mars-display mars-reveal mt-8 font-black leading-[1.16] tracking-tight text-text-primary break-keep"
            style={{ fontSize: 'clamp(34px,5vw,58px)' }}
          >
            <Placeholder value={HERO.headline} />
          </h1>

          <p className="mars-reveal mt-7 max-w-[720px] text-[clamp(30px,1.6vw,17.5px)] leading-[1.85] text-text-secondary break-keep">
            <Placeholder value={HERO.sub} />
          </p>
          <p className="mars-reveal mt-5 max-w-[520px] text-[clamp(15px,1.6vw,17.5px)] leading-[1.85] text-text-secondary break-keep">
            <Placeholder value={HERO.sub2} />
          </p>
        </div>

        <div className="mars-reveal hidden lg:block">
          <EmblemLines />
        </div>
      </div>
    </section>
  )
}
