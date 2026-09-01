import ScrollFade from '../ScrollFade'
import AnchorMark from '../AnchorMark'
import { VALUES } from '../teamContent'
import Placeholder from './Placeholder'

export default function TeamValues() {
  return (
    <section
      id="values"
      className="relative flex min-h-screen items-center overflow-hidden px-[6vw] py-20 scroll-mt-[66px]"
    >
      <AnchorMark
        size={520}
        angle={16}
        opacity={0.04}
        className="pointer-events-none absolute -left-32 bottom-0"
      />

      <div className="relative z-[1] mx-auto w-full max-w-[1100px]">
        <ScrollFade className="text-center">
          <p className="text-[12.5px] font-bold tracking-[0.22em] text-brand">HOW WE WORK</p>
          <h2
            className="mars-display mx-auto mt-5 font-extrabold tracking-tight text-text-primary break-keep"
            style={{ fontSize: 'clamp(30px,3.8vw,46px)' }}
          >
            우리가 일하는 세 가지 방식
          </h2>
        </ScrollFade>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {VALUES.map((v) => (
            <ScrollFade key={v.no}>
              <article className="group h-full rounded-3xl border border-surface-border bg-surface-card2 p-9 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-soft hover:shadow-[0_20px_44px_rgba(220,20,60,0.09)]">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-subtle text-[13px] font-black text-brand">
                  {v.no}
                </span>
                <h3 className="mars-display mt-7 text-[20px] font-extrabold leading-snug tracking-tight text-text-primary break-keep">
                  <Placeholder value={v.title} />
                </h3>
                <p className="mt-4 text-[14.5px] leading-[1.9] text-text-secondary break-keep">
                  <Placeholder value={v.desc} />
                </p>
              </article>
            </ScrollFade>
          ))}
        </div>
      </div>
    </section>
  )
}
