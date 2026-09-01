import ScrollFade from '../ScrollFade'
import AnchorMark from '../AnchorMark'
import { METRICS } from '../teamContent'
import { isBlank } from '../isBlank'

export default function TeamMetrics() {
  return (
    <section
      id="metrics"
      className="relative flex min-h-screen items-center overflow-hidden px-[6vw] py-20 scroll-mt-[66px]"
    >
      <div className="mars-glow-bg" style={{ width: 700, height: 700, left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }} />

      <AnchorMark
        size={700}
        angle={0}
        opacity={0.045}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      />

      <div className="relative z-[1] mx-auto w-full max-w-[1100px]">
        <ScrollFade className="text-center">
          <p className="text-[12.5px] font-bold tracking-[0.22em] text-brand">INDICATOR</p>
          <h2
            className="mars-display mx-auto mt-5 font-extrabold tracking-tight text-text-primary break-keep"
            style={{ fontSize: 'clamp(30px,3.8vw,46px)' }}
          >
            지표
          </h2>
        </ScrollFade>

        <div className="mt-20 grid gap-y-16 gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((m, i) => (
            <ScrollFade key={i}>
              <div className="text-center">
                <p className="flex items-baseline justify-center gap-1.5">
                  <span
                    className={`mars-display font-black leading-none tracking-[-0.04em] tabular-nums ${
                      isBlank(m.value) ? 'text-text-hint' : 'text-text-primary'
                    }`}
                    style={{ fontSize: 'clamp(40px,5.6vw,64px)' }}
                  >
                    {m.value}
                  </span>
                  {m.unit && (
                    <span className="text-[clamp(17px,2vw,23px)] font-extrabold text-brand">{m.unit}</span>
                  )}
                </p>
                <p
                  className={`mt-5 text-[13.5px] leading-[1.8] break-keep ${
                    isBlank(m.label) ? 'text-text-hint' : 'text-text-secondary'
                  }`}
                >
                  {m.label}
                </p>
              </div>
            </ScrollFade>
          ))}
        </div>
      </div>
    </section>
  )
}
