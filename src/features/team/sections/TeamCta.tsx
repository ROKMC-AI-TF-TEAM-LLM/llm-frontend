import ScrollFade from '../ScrollFade'
import AnchorMark from '../AnchorMark'
import { CTA } from '../teamContent'
import Placeholder from './Placeholder'

export default function TeamCta() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-[6vw] py-20 text-center">
      <div className="mars-glow-bg" style={{ width: 560, height: 560, left: '50%', bottom: '-14%', transform: 'translateX(-50%)' }} />

      <AnchorMark
        size={340}
        angle={0}
        opacity={0.05}
        className="pointer-events-none absolute left-[7%] top-[14%]"
      />
      <AnchorMark
        size={260}
        angle={0}
        opacity={0.045}
        className="pointer-events-none absolute right-[8%] bottom-[16%]"
      />

      <ScrollFade className="relative z-[1] mx-auto max-w-[720px]">
        <h2
          className="mars-display leading-[1.26] tracking-tight text-brand break-keep"
          style={{ fontSize: 'clamp(30px,4.6vw,54px)' }}
        >
          <Placeholder value={CTA.headline} />
        </h2>

        <p className="mx-auto mt-7 max-w-[470px] text-text-secondary text-[clamp(14.5px,1.6vw,25px)] leading-[1.9] text-text-brand break-keep">
          <Placeholder value={CTA.sub} />
        </p>
      </ScrollFade>
    </section>
  )
}
