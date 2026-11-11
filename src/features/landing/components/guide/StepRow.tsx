import { Reveal } from './Reveal'

// 단계 하나: 화면 예시 카드와 설명을 좌우로 놓는다(reverse면 반대로)
export function StepRow({
  id,
  step,
  title,
  desc,
  bullets,
  mock,
  mockHeight,
  reverse,
}: {
  id?: string
  step: string
  title: React.ReactNode
  desc: string
  bullets?: string[]
  mock: React.ReactNode
  mockHeight: number
  reverse?: boolean
}) {
  const card = (
    <Reveal
      className="flex-[1.15] min-w-[340px] w-full"
      delay={reverse ? 100 : 0}
    >
      <div
        className="relative rounded-3xl overflow-hidden bg-white border border-[#f0e3e6] shadow-[0_30px_70px_rgba(150,0,40,0.08)]"
        style={{ height: mockHeight }}
      >
        {mock}
      </div>
    </Reveal>
  )
  const text = (
    <Reveal className="flex-1 min-w-[300px]" delay={reverse ? 0 : 100}>
      <div className="text-14 font-extrabold text-brand tracking-[0.12em] mb-4">
        {step}
      </div>
      <div className="mars-display text-[32px] md:text-[38px] font-extrabold mb-5 leading-[1.3] tracking-tight">
        {title}
      </div>
      <p className="m-0 text-18 md:text-18 font-semibold leading-[1.85] text-ink-soft">
        {desc}
      </p>
      {bullets && (
        <ul className="mt-7 flex flex-col gap-3.5">
          {bullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-3 text-16 leading-[1.6] text-[#4a4750]"
            >
              <span className="mt-[7px] shrink-0 w-1.5 h-1.5 rounded-full bg-brand" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </Reveal>
  )
  return (
    <section
      id={id}
      data-guide-section
      className="px-[6vw] min-h-screen flex items-center py-16 scroll-mt-[66px]"
    >
      <div
        className={`max-w-[1160px] w-full mx-auto flex items-center gap-16 flex-wrap ${reverse ? 'flex-row-reverse' : ''}`}
      >
        {card}
        {text}
      </div>
    </section>
  )
}
