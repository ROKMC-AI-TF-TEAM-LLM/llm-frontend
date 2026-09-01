import ScrollFade from '../ScrollFade'
import KeywordConstellation from '../KeywordConstellation'
import { DOMAIN_ROWS } from '../teamContent'
import Placeholder from './Placeholder'

const ICONS = [
  <path key="0" d="M12 3l7 3v5c0 4.2-2.8 7.4-7 9-4.2-1.6-7-4.8-7-9V6l7-3z M9 12l2 2 4-4" />,
  <path key="1" d="M4 19V9m5 10V5m5 14v-7m5 7V8" />,
  <path key="2" d="M3 7l9-4 9 4-9 4-9-4z M3 12l9 4 9-4 M3 17l9 4 9-4" />,
]

export default function TeamDomains() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-[6vw] py-20">
      <div className="mx-auto grid w-full max-w-[1180px] items-center gap-14 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <ScrollFade>
            <p className="text-[12.5px] font-bold tracking-[0.22em] text-brand">WHAT WE COVER</p>
            <h2
              className="mars-display mt-5 font-extrabold leading-[1.3] tracking-tight text-text-primary break-keep"
              style={{ fontSize: 'clamp(27px,3.4vw,40px)' }}
            >
              흩어진 규정을
              <br />
              하나의 답으로
            </h2>
          </ScrollFade>

          <div className="mt-12 flex flex-col">
            {DOMAIN_ROWS.map((r, i) => (
              <ScrollFade key={i}>
                <div className="border-t border-surface-border py-7">
                  <div className="flex items-center gap-3">
                    <svg
                      className="h-[19px] w-[19px] shrink-0 text-brand"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.9}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {ICONS[i % ICONS.length]}
                    </svg>
                    <h3 className="mars-display text-[18.5px] font-extrabold tracking-tight text-text-primary break-keep">
                      <Placeholder value={r.title} />
                    </h3>
                  </div>
                  <p className="mt-3.5 text-[14.5px] leading-[1.9] text-text-secondary break-keep">
                    <Placeholder value={r.desc} />
                  </p>
                </div>
              </ScrollFade>
            ))}
          </div>
        </div>

        <KeywordConstellation />
      </div>
    </section>
  )
}
