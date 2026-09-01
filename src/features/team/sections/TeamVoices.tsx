import ScrollFade from '../ScrollFade'
import AnchorMark from '../AnchorMark'
import { VOICES } from '../teamContent'
import Placeholder from './Placeholder'
import { isBlank } from '../isBlank'

export default function TeamVoices() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-surface-card1 px-[6vw] py-20">
      <AnchorMark
        size={460}
        angle={-20}
        opacity={0.045}
        className="pointer-events-none absolute -right-24 top-10"
      />

      <div className="relative z-[1] mx-auto w-full max-w-[1100px]">
        <ScrollFade className="text-center">
          <p className="text-[12.5px] font-bold tracking-[0.22em] text-brand">THE TEAM</p>
          <h2
            className="mars-display mx-auto mt-5 font-extrabold tracking-tight text-text-primary break-keep"
            style={{ fontSize: 'clamp(30px,3.8vw,46px)' }}
          >
            만드는 사람들의 이야기
          </h2>
        </ScrollFade>

        <div className="mt-16 grid gap-5 sm:grid-cols-2">
          {VOICES.map((v, i) => (
            <ScrollFade key={i}>
              <figure className="flex h-full flex-col rounded-3xl border border-surface-border bg-white p-8 transition-shadow duration-300 hover:shadow-[0_18px_44px_rgba(26,25,23,0.08)]">
                <svg aria-hidden width="26" height="20" viewBox="0 0 26 20" className="text-brand-soft" fill="currentColor">
                  <path d="M0 20V11.2C0 5 3.4 1 9.6 0l1 2.6C7 3.7 5.2 5.9 5 9h4.2v11H0Zm15.6 0V11.2C15.6 5 19 1 25.2 0l1 2.6c-3.6 1.1-5.4 3.3-5.6 6.4H25v11h-9.4Z" />
                </svg>

                <blockquote className="mt-5 flex-1 text-[15.5px] leading-[1.95] text-text-primary break-keep">
                  <Placeholder value={v.quote} />
                </blockquote>

                <figcaption className="mt-7 flex items-center gap-3 border-t border-surface-border pt-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-light text-[14px] font-black text-white">
                    {isBlank(v.name) ? '·' : v.name.charAt(0)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-bold text-text-primary">
                      <Placeholder value={v.name} />
                    </span>
                    <span className="mt-0.5 block truncate text-[12.5px] text-text-muted">
                      <Placeholder value={v.role} />
                    </span>
                  </span>
                </figcaption>
              </figure>
            </ScrollFade>
          ))}
        </div>
      </div>
    </section>
  )
}
