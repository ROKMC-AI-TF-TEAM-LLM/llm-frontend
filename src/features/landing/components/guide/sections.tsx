// 이용 안내(/guide) 화면의 구역들. 단계 설명(STEP 01~04)은 GuideSteps, 나머지는 각 구역 컴포넌트.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MarsPlanet from '../MarsPlanet'
import { Reveal } from './Reveal'
import { StepRow } from './StepRow'
import { Step01Mock, DomainStepMock, Step02Mock, Step03Mock } from './mocks'
import { SMARTS, TIPS, FAQ } from './content'

export function GuideHero({ onNext }: { onNext: () => void }) {
  return (
    <section
      data-guide-section
      className="relative px-[6vw] min-h-[calc(100vh-73px)] flex items-center overflow-hidden"
    >
      <div className="absolute right-[4%] top-[14%] w-[340px] h-[340px] opacity-90 pointer-events-none animate-[marsFloat_8s_ease-in-out_infinite]">
        <div className="absolute -inset-[14%] rounded-full border-[1.5px] border-[rgba(228,0,43,0.16)] animate-[marsSpin_28s_linear_infinite]">
          <div className="absolute -left-1 top-[48%] w-[9px] h-[9px] rounded-full bg-brand shadow-[0_0_12px_3px_rgba(228,0,43,0.5)]" />
        </div>
        <div className="absolute -inset-[24%] rounded-full border-[1.5px] border-[rgba(228,0,43,0.16)] animate-[marsSpin_40s_linear_infinite]">
          <div className="absolute -left-1 top-[48%] w-[9px] h-[9px] rounded-full bg-brand shadow-[0_0_12px_3px_rgba(228,0,43,0.5)]" />
        </div>
        <div className="absolute inset-0">
          <MarsPlanet glow className="w-full h-full" />
        </div>
      </div>
      <div className="relative w-full max-w-[760px] mx-auto text-center">
        <Reveal className="text-13 font-bold tracking-[0.14em] text-brand-deep mb-[14px]">
          GUIDE
        </Reveal>
        <Reveal delay={70}>
          <h1 className="mars-display m-0 font-black leading-[1.18] tracking-tight text-[length:clamp(38px,5.2vw,60px)]">
            <span className="text-brand">MARS</span> 이용법
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-6 mx-auto max-w-[540px] text-18 leading-[1.75] font-semibold text-ink-soft">
            질문 입력부터 도메인 선택, 근거 확인, 문서 검색까지. MARS가 실제로
            어떻게 동작하는지 보여드립니다.
          </p>
        </Reveal>

        <Reveal
          delay={240}
          className="mt-9 flex flex-wrap items-center justify-center gap-2.5"
        >
          {[
            '근거 기반 답변',
            '실시간 스트리밍',
            '출처 함께 제시',
            '도메인별 검색',
          ].map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-rose-line text-14 font-semibold text-text-secondary shadow-[0_4px_14px_rgba(150,0,40,0.04)]"
            >
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                className="stroke-brand-vivid"
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {f}
            </span>
          ))}
        </Reveal>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 bottom-9 animate-[hintIn_.8s_ease_.5s_both]">
        <button
          type="button"
          onClick={onNext}
          className="group flex flex-col items-center gap-2 text-[#b89aa0] hover:text-brand transition-colors"
        >
          <span className="text-12 font-semibold tracking-wider">
            아래로 스크롤
          </span>
          <svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-[marsFloat_1.8s_ease-in-out_infinite]"
          >
            <path d="M12 5v14M6 13l6 6 6-6" />
          </svg>
        </button>
      </div>
    </section>
  )
}

export function GuideSteps() {
  return (
    <>
      <StepRow
        id="step-01"
        step="STEP 01"
        title={
          <>
            궁금한 것을
            <br />
            그대로 입력하세요
          </>
        }
        desc={
          '"해병대님, 무엇을 도와드릴까요?"로 시작해 궁금한 규정·절차를 평소 말하듯 입력하면 됩니다.'
        }
        bullets={[
          '전문 용어를 몰라도 됩니다 — 일상 언어로 질문하세요.',
          '규정 번호나 정확한 명칭을 모두 외울 필요가 없습니다.',
          '질문이 구체적일수록 더 정확한 근거를 찾아냅니다.',
        ]}
        mock={<Step01Mock />}
        mockHeight={500}
      />

      <StepRow
        id="step-02"
        reverse
        step="STEP 02"
        title={
          <>
            필요한 도메인만
            <br />
            골라서 검색하세요
          </>
        }
        desc="전체, 인사·복지, 정보화·보안, 재무·법무, 일반, 교범, 훈령 중 하나를 선택하면 해당 범위의 문서에서만 근거를 찾아 답합니다."
        bullets={[
          '분야를 좁히면 엉뚱한 문서가 섞이지 않아 정확도가 올라갑니다.',
          '무엇을 고를지 모르겠다면 "전체"로 두면 됩니다.',
          '선택한 도메인은 보낸 질문 위에 태그로 표시됩니다.',
        ]}
        mock={<DomainStepMock />}
        mockHeight={500}
      />

      <StepRow
        id="step-03"
        step="STEP 03"
        title={
          <>
            근거를 찾아
            <br />
            실시간으로 답합니다
          </>
        }
        desc="질문을 보내면 MARS가 관련 문서를 찾아 실시간으로 답을 작성합니다."
        bullets={[
          'RAG 검색으로 실제 규정 원문에서 근거를 찾습니다.',
          '답변은 완성될 때까지 기다리지 않고 실시간으로 표시됩니다.',
          '답변이 마음에 들지 않으면 언제든 다시 생성할 수 있습니다.',
        ]}
        mock={<Step02Mock />}
        mockHeight={500}
      />

      <StepRow
        id="step-04"
        reverse
        step="STEP 04"
        title={
          <>
            근거는 다 보여주고,
            <br />더 깊이 볼 수도 있어요
          </>
        }
        desc={
          '답변 아래 "출처 보기"를 누르면 실제로 참고한 문서 원문 목록이 펼쳐집니다.'
        }
        bullets={[
          '어떤 문서의 몇 페이지를 참고했는지 함께 표시됩니다.',
          '출처 문서를 클릭하면 원문 상세를 바로 열어볼 수 있습니다.',
          '근거가 불충분하면 추측하지 않고 솔직하게 안내합니다.',
        ]}
        mock={<Step03Mock />}
        mockHeight={500}
      />
    </>
  )
}

export function GuideSmart() {
  return (
    <GuideSection id="smart" width="max-w-[960px]">
      <SectionIntro
        eyebrow="SMART BEHAVIOR"
        title="이런 점이 다릅니다"
        desc="단순히 그럴듯한 답을 내놓는 대신, 규정에 근거해 정직하게 답하도록 설계했습니다."
        descClassName="mb-13 max-w-[600px]"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {SMARTS.map((s, i) => (
          <Reveal
            key={s.title}
            delay={i * 70}
            className="p-7 rounded-2xl bg-white border border-rose-line shadow-[0_10px_30px_rgba(150,0,40,0.04)]"
          >
            <div className="text-18 font-extrabold mars-brand-serif mb-2">
              {s.title}
            </div>
            <div className="text-15 text-ink-soft leading-[1.7]">{s.desc}</div>
          </Reveal>
        ))}
      </div>
    </GuideSection>
  )
}

export function GuideTips() {
  return (
    <GuideSection id="tips" width="max-w-[820px]">
      <SectionIntro
        eyebrow="TIPS"
        title="더 정확하게 쓰는 법"
        desc="같은 질문도 조금만 다듬으면 훨씬 정확한 근거를 찾을 수 있습니다."
        descClassName="mb-12 max-w-[560px]"
      />
      <div className="flex flex-col gap-4">
        {TIPS.map((tip, i) => (
          <Reveal
            key={tip.n}
            delay={i * 80}
            className="flex items-start gap-5 px-7 py-6 rounded-2xl bg-white border border-rose-line shadow-[0_10px_30px_rgba(150,0,40,0.04)]"
          >
            <span className="flex-none w-8 h-8 rounded-full bg-brand-subtle text-brand text-15 font-extrabold flex items-center justify-center">
              {tip.n}
            </span>
            <span className="text-16 leading-[1.7] text-ink pt-0.5">
              {tip.text}
            </span>
          </Reveal>
        ))}
      </div>
    </GuideSection>
  )
}

export function GuideFaq() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  return (
    <GuideSection id="faq" width="max-w-[760px]">
      <SectionIntro
        eyebrow="FAQ"
        title="자주 묻는 질문"
        desc="MARS를 쓰기 전 궁금해할 만한 것들을 모았습니다."
        descClassName="mb-12 max-w-[560px]"
        titleSize="text-[length:clamp(30px,3.8vw,46px)]"
      />
      <div className="flex flex-col gap-3">
        {FAQ.map((item, i) => {
          const isOpen = openFaq === i
          return (
            <Reveal
              key={item.q}
              delay={i * 60}
              className="rounded-[18px] bg-white border border-rose-line overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-7 py-6 text-left"
              >
                <span className="text-18 font-bold text-text-primary mars-brand-serif">
                  {item.q}
                </span>
                <span
                  className={`flex-none w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-[#fdeef1] rotate-180' : 'bg-[#f6f2f3]'}`}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="stroke-brand-deep"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </button>
              {isOpen && (
                <div className="px-7 pb-6 text-16 leading-[1.8] text-ink-soft animate-[faqIn_.3s_cubic-bezier(.2,.7,.2,1)]">
                  {item.a}
                </div>
              )}
            </Reveal>
          )
        })}
      </div>
    </GuideSection>
  )
}

export function GuideCta() {
  const navigate = useNavigate()
  return (
    <section
      data-guide-section
      className="relative px-[6vw] min-h-screen flex flex-col items-center justify-center text-center overflow-hidden"
    >
      <Reveal className="relative z-[2]">
        <h2 className="mars-display m-0 mb-5 font-black tracking-tight text-[length:clamp(36px,5vw,60px)]">
          지금 <span className="text-brand">시작</span>해보세요
        </h2>
        <p className="mx-auto max-w-[460px] text-18 font-semibold text-text-secondary leading-relaxed">
          해병대의 모든 규정을, 대화 한 번으로.
          <br />
          MARS가 장병 여러분과 함께합니다.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mars-pill mars-pill-brand mt-9"
        >
          MARS 시작하기 <span aria-hidden>→</span>
        </button>
      </Reveal>
    </section>
  )
}

// SMART·TIPS·FAQ 구역의 공통 틀: 화면 높이를 채우고 가운데 정렬한다(StepRow와 같은 여백)
function GuideSection({
  id,
  width,
  children,
}: {
  id: string
  width: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      data-guide-section
      className="px-[6vw] min-h-screen flex items-center py-16 scroll-mt-[66px]"
    >
      <div className={`w-full ${width} mx-auto`}>{children}</div>
    </section>
  )
}

// 구역 머리: 작은 영문 표제, 큰 제목, 한 줄 설명이 차례로 떠오른다
function SectionIntro({
  eyebrow,
  title,
  desc,
  descClassName,
  titleSize = 'text-[length:clamp(30px,3.6vw,44px)]',
}: {
  eyebrow: string
  title: string
  desc: string
  descClassName: string
  titleSize?: string
}) {
  return (
    <>
      <Reveal className="text-center mb-3 text-14 font-bold tracking-[0.14em] text-brand-deep">
        {eyebrow}
      </Reveal>
      <Reveal delay={60}>
        <h2
          className={`mars-display text-center mx-auto mb-2 font-extrabold tracking-tight ${titleSize}`}
        >
          {title}
        </h2>
      </Reveal>
      <Reveal delay={120}>
        <p
          className={`text-center mx-auto font-semibold text-18 leading-[1.7] text-ink-soft ${descClassName}`}
        >
          {desc}
        </p>
      </Reveal>
    </>
  )
}
