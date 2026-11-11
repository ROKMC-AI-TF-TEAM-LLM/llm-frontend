import type { Ref } from 'react'
import { AI_NOTICE } from '@/shared/constants'
import KeywordConstellation from '@/features/team/components/KeywordConstellation'
import { DOMAIN_ROWS } from '@/features/team/teamContent'

const DOMAIN_ICONS = [
  <path
    key="0"
    d="M12 3l7 3v5c0 4.2-2.8 7.4-7 9-4.2-1.6-7-4.8-7-9V6l7-3z M9 12l2 2 4-4"
  />,
  <path key="1" d="M4 19V9m5 10V5m5 14v-7m5 7V8" />,
  <path key="2" d="M3 7l9-4 9 4-9 4-9-4z M3 12l9 4 9-4 M3 17l9 4 9-4" />,
]

const CORPS_CARDS = [
  {
    title: '해병대 규정만',
    desc: '타군이나 일반 행정 자료가 섞이지 않습니다. 해병대사령부가 관리하는 규정과 지침만을 근거로 답변하므로, 우리 부대에 적용되지 않는 내용을 걸러낼 필요가 없습니다.',
    icon: (
      <path d="M12 3l7 3v5c0 4.2-2.8 7.4-7 9-4.2-1.6-7-4.8-7-9V6l7-3z M9 12l2 2 4-4" />
    ),
  },
  {
    title: '현장의 언어로',
    desc: '실제 부대에서 쓰는 용어와 편제를 기준으로 이해합니다. 규정집에 적힌 문어체 그대로 입력하지 않아도, 평소 보고하듯 물어보면 필요한 조항을 찾아냅니다.',
    icon: (
      <path d="M8 10h8M8 14h5M21 12a8 8 0 0 1-8 8H7l-4 3v-4.6A8 8 0 0 1 13 4a8 8 0 0 1 8 8z" />
    ),
  },
  {
    title: '폐쇄망 안에서',
    desc: '국방망 내부에서 완결되도록 구축했습니다. 질문도 문서도 외부로 나가지 않기 때문에, 보안 규정을 신경 쓰지 않고 업무 자료를 그대로 다룰 수 있습니다.',
    icon: <path d="M5 11V8a7 7 0 0 1 14 0v3M4 11h16v10H4z M12 15v2" />,
  },
]

type IconType = 'learn' | 'source' | 'update' | 'domain' | 'stream' | 'doc'
const FeatureIcon = ({ type }: { type: IconType }) => {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  if (type === 'learn')
    return (
      <svg {...common}>
        <path d="M12 3l7 3v5c0 4.2-2.8 7.4-7 9-4.2-1.6-7-4.8-7-9V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    )
  if (type === 'source')
    return (
      <svg {...common}>
        <path d="M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z" />
        <path d="M14 3v6h6M8 13h8M8 17h6" />
      </svg>
    )
  if (type === 'domain')
    return (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="7" rx="1.6" />
        <rect x="14" y="3" width="7" height="7" rx="1.6" />
        <rect x="3" y="14" width="7" height="7" rx="1.6" />
        <path d="M14 17.5h7M17.5 14v7" />
      </svg>
    )
  if (type === 'stream')
    return (
      <svg {...common}>
        <path d="M3 12h4l2.5-6 5 12L17 12h4" />
      </svg>
    )
  if (type === 'doc')
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    )
  return (
    <svg {...common}>
      <path d="M21 12a9 9 0 1 1-2.6-6.3M21 4v5h-5" />
    </svg>
  )
}

const FEATURES: { icon: IconType; title: string; desc: string }[] = [
  {
    icon: 'learn',
    title: '해병대 특화',
    desc: '병영생활·인사·복무 규정 등 우리 군 실무 문서를 참조해 부대 맥락에 맞게 답합니다.',
  },
  {
    icon: 'source',
    title: '출처 기반 답변',
    desc: 'RAG 검색으로 실제 규정 원문을 찾아 근거·조항과 함께 답변해 신뢰할 수 있습니다.',
  },
  {
    icon: 'domain',
    title: '도메인별 검색',
    desc: '인사·복지, 정보화·보안 등 분야를 좁히면 엉뚱한 문서가 섞이지 않아 정확해집니다.',
  },
  {
    icon: 'stream',
    title: '실시간 스트리밍',
    desc: '답이 완성될 때까지 기다리지 않고, 찾는 과정과 결과를 즉시 보여줍니다.',
  },
  {
    icon: 'doc',
    title: '문서함 직접 열람',
    desc: '대화 없이도 카테고리와 검색어로 전체 규정 문서를 바로 찾아볼 수 있습니다.',
  },
  {
    icon: 'update',
    title: '최신 규정 반영',
    desc: '개정된 법령·지침을 문서 저장소에 반영해 언제나 최신 기준으로 안내합니다.',
  },
]

/** 로그인 화면 첫 화면 아래의 소개 섹션들. featuresRef는 '자세히 보기'로 내려갈 첫 섹션에 단다 */
export function IntroSections({
  featuresRef,
}: {
  featuresRef: Ref<HTMLDivElement>
}) {
  return (
    <>
      <section
        ref={featuresRef}
        className="mars-section px-[6vw] py-20 min-h-screen flex flex-col justify-center"
      >
        <div className="max-w-[1180px] mx-auto w-full">
          <div className="mars-reveal mars-eyebrow mb-4">가장 큰 특징</div>
          <h2
            className="mars-reveal mars-display max-w-[820px]"
            style={{ fontSize: 'clamp(27px,3.2vw,42px)' }}
          >
            법령, 규정, 규칙을
            <br />
            <span className="text-brand">인공지능</span>이 찾아냅니다.
          </h2>
          <p className="mars-reveal font-semibold max-w-[560px] mt-4 mb-10 text-[16px] text-text-secondary leading-[1.7] break-keep">
            MARS는 해병대 실무 문서를 근거로 답하며, 모든 답변에 출처를 함께
            제시합니다.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {FEATURES.map((f) => (
              <div key={f.title} className="mars-reveal mars-card p-5">
                <div className="w-9 h-9 rounded-lg bg-brand-subtle border border-brand-soft flex items-center justify-center mb-3.5 text-brand">
                  <FeatureIcon type={f.icon} />
                </div>
                <div className="text-[15.5px] font-extrabold mb-1.5 tracking-tight">
                  {f.title}
                </div>
                <div className="text-[13.5px] text-text-secondary leading-[1.65] break-keep">
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-[6vw] mars-section min-h-screen flex flex-col justify-center py-20">
        <div className="max-w-[1280px] mx-auto w-full flex flex-col lg:flex-row gap-14 items-center">
          <div className="flex-1 min-w-0">
            <div className="mars-reveal mars-eyebrow mb-5">동작 방식</div>
            <h2
              className="mars-reveal mars-display mb-6"
              style={{ fontSize: 'clamp(30px,3.6vw,48px)' }}
            >
              추측하지 않고,
              <br />
              <span className="text-brand">찾아서</span> 답합니다.
            </h2>
            <p className="mars-reveal font-semibold text-[17px] text-text-secondary leading-relaxed mb-12 max-w-[400px] break-keep">
              궁금한 규정과 절차를 평소 말하듯 입력하면, MARS가 원문 조항을 찾아
              대조한 뒤 근거와 함께 답합니다.
            </p>
            <div className="flex flex-col gap-7">
              {[
                [
                  'STEP 01',
                  '질문 입력',
                  '궁금한 규정·절차를 평소 말하듯 입력합니다.',
                ],
                [
                  'STEP 02',
                  '문서 검색·대조',
                  'MARS가 관련 규정 문서를 찾아 원문 조항을 대조합니다.',
                ],
                [
                  'STEP 03',
                  '근거와 함께 답변',
                  '어떤 문서 몇 조를 참고했는지 출처와 함께 답합니다.',
                ],
              ].map(([s, t, d]) => (
                <div key={s} className="mars-reveal flex gap-5 items-start">
                  <span className="shrink-0 text-[12px] font-extrabold text-brand tracking-[0.1em] pt-1 w-14">
                    {s}
                  </span>
                  <div>
                    <div className="text-[17px] font-extrabold mb-1 mars-brand-serif tracking-tight">
                      {t}
                    </div>
                    <div className="text-[14px] text-text-secondary leading-relaxed break-keep">
                      {d}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-0 w-full">
            <div className="mars-reveal rounded-3xl bg-white border border-brand-soft/60 shadow-[0_30px_70px_rgba(150,0,40,0.10)] overflow-hidden">
              <div className="p-7 pb-4 flex flex-col gap-5">
                <div className="self-end max-w-[72%] px-5 py-3 rounded-[20px_20px_6px_20px] bg-gradient-to-br from-brand to-brand-light text-white text-[15px] leading-relaxed shadow-[0_10px_22px_rgba(220,20,60,0.2)]">
                  야간근무 수당은 어떻게 지급되나요?
                </div>
                <div className="text-[15px] leading-relaxed text-text-primary">
                  <b className="font-extrabold">야간근무 수당</b>은 다음
                  기준으로 지급됩니다.
                  <div className="mt-3.5 flex flex-col gap-2.5">
                    {[
                      '22시부터 익일 06시 사이 근무가 대상입니다.',
                      '시간당 통상임금의 50%를 가산해 지급합니다.',
                      '근무 기록은 부대 인사담당이 월 단위로 정산합니다.',
                    ].map((t, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <span className="shrink-0 w-5 h-5 mt-0.5 rounded-md bg-brand-subtle text-brand text-[11.5px] font-extrabold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-subtle text-brand text-xs font-medium rounded-full border border-brand-soft">
                      <svg
                        width={12}
                        height={12}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="rotate-180"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                      출처 2개 닫기
                    </span>
                    <div className="mt-2 flex flex-col gap-2">
                      {[
                        {
                          title: '군인 보수 규정',
                          type: '규정',
                          domain: '재무·법무',
                          dept: '국방부 · 재정관리실',
                          style: {
                            bar: '#e0952b',
                            bg: '#fbf1e2',
                            text: '#b3720f',
                          },
                        },
                        {
                          title: '공무원 수당 등에 관한 규정',
                          type: '법률',
                          domain: '인사·복지',
                          dept: '인사혁신처',
                          style: {
                            bar: '#e4002b',
                            bg: '#fdeef1',
                            text: '#c0002a',
                          },
                        },
                      ].map((s) => (
                        <div
                          key={s.title}
                          className="flex items-center gap-3 p-3 rounded-xl border border-rose-border bg-white"
                        >
                          <span
                            className="shrink-0 flex items-center justify-center"
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 10,
                              background: s.style.bg,
                              color: s.style.bar,
                            }}
                          >
                            <svg
                              width={18}
                              height={18}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <path d="M14 2v6h6M8 13h8M8 17h5" />
                            </svg>
                          </span>
                          <span className="min-w-0 flex-1 flex items-center gap-2">
                            <span className="shrink-0 text-[14px] font-bold text-text-primary">
                              {s.title}
                            </span>
                            <span className="min-w-0 truncate flex items-center gap-1.5 text-[12px] text-text-muted">
                              <span>{s.type}</span>
                              <span aria-hidden>·</span>
                              <span style={{ color: s.style.text }}>
                                {s.domain}
                              </span>
                              <span aria-hidden>·</span>
                              <span>{s.dept}</span>
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-6">
                <div
                  style={{
                    border: '1px solid #f0e3e6',
                    boxShadow: '0 12px 30px rgba(160,0,40,0.05)',
                  }}
                  className="bg-white rounded-[30px] overflow-hidden cursor-default select-none"
                >
                  <div className="px-5 pt-6 pb-1 text-[15px] text-text-muted">
                    메시지를 입력하세요...
                  </div>
                  <div className="flex items-center justify-between px-3 pb-3 pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-10 h-10 flex items-center justify-center rounded-full text-text-muted shrink-0">
                        <svg
                          className="w-[22px] h-[22px]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.9}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                          />
                        </svg>
                      </span>
                      <span className="inline-flex items-center gap-1.5 pl-2 pr-2.5 h-10 rounded-full text-[13.5px] font-medium text-text-muted">
                        <svg
                          width={20}
                          height={20}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 7h18M3 12h18M3 17h18" />
                        </svg>
                        <span>전체</span>
                        <svg
                          width={14}
                          height={14}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </div>
                    <div
                      style={{
                        background: 'linear-gradient(135deg,#e4002b,#ff2d55)',
                        boxShadow: '0 5px 13px rgba(228,0,43,0.28)',
                      }}
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    >
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.4}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 19V5M5 12l7-7 7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center pb-5 text-[13px] text-text-muted">
                {AI_NOTICE}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-[6vw] mars-section min-h-screen flex flex-col justify-center py-20 overflow-hidden">
        <div className="max-w-[1280px] mx-auto w-full grid items-center gap-14 lg:grid-cols-[.85fr_1.15fr]">
          <div className="min-w-0">
            <div className="mars-reveal mars-eyebrow mb-5">WHAT WE COVER</div>
            <h2
              className="mars-reveal mars-display mb-12 leading-[1.25]"
              style={{ fontSize: 'clamp(30px,3.6vw,48px)' }}
            >
              흩어진 규정을
              <br />
              <span className="text-brand">하나의 답</span>으로
            </h2>

            <div className="flex flex-col">
              {DOMAIN_ROWS.map((r, i) => (
                <div
                  key={r.title}
                  className="mars-reveal border-t border-surface-border py-7"
                >
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
                      {DOMAIN_ICONS[i % DOMAIN_ICONS.length]}
                    </svg>
                    <h3 className="mars-brand-serif text-[18.5px] font-bold tracking-tight text-text-primary break-keep">
                      {r.title}
                    </h3>
                  </div>
                  <p className="mt-3.5 text-[14.5px] leading-[1.9] text-text-secondary break-keep">
                    {r.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mars-reveal min-w-0">
            <KeywordConstellation />
          </div>
        </div>
      </section>

      {/* ── 해병대를 위해 만들었습니다 (틀만 잡아둔 섹션 · 문구 교체 예정) ── */}
      <section className="relative px-[6vw] mars-section min-h-screen flex flex-col justify-center py-20 overflow-hidden">
        <div
          className="mars-glow-bg"
          style={{
            width: 620,
            height: 620,
            left: '-8%',
            top: '46%',
            transform: 'translateY(-50%)',
          }}
        />

        <div className="relative z-[1] max-w-[1280px] mx-auto w-full">
          <div className="max-w-[760px]">
            <div className="mars-reveal mars-eyebrow mb-5">FOR THE CORPS</div>
            <h2
              className="mars-reveal mars-display leading-[1.22]"
              style={{ fontSize: 'clamp(30px,3.6vw,48px)' }}
            >
              다른 누구도 아닌,
              <br />
              <span className="text-brand">해병대</span>를 위해 만들었습니다.
            </h2>
            <p className="mars-reveal mt-7 text-[17px] font-semibold text-text-primary leading-[1.85] break-keep max-w-[680px]">
              규정 하나를 확인하려고 여러 부서에 전화를 돌리고, 어느 자료가
              최신인지 몰라 다시 묻는 일.
            </p>
            <p className="mars-reveal text-[17px] font-semibold text-text-primary leading-[1.85] break-keep max-w-[680px]">
              해병대의 일상에서 반복되던 그 시간을 줄이기 위해
            </p>
            <p className="mars-reveal text-[17px] font-semibold text-text-primary leading-[1.85] break-keep max-w-[680px]">
              해병대의 규정과 업무 방식만 놓고 처음부터 설계했습니다.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CORPS_CARDS.map((c) => (
              <div
                key={c.title}
                className="mars-reveal rounded-2xl border border-brand-soft/60 bg-white p-7 shadow-[0_18px_44px_rgba(150,0,40,0.07)]"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-subtle text-brand">
                  <svg
                    width={21}
                    height={21}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.9}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {c.icon}
                  </svg>
                </span>
                <h3 className="mars-brand-serif mt-5 text-[18px] font-bold tracking-tight text-text-primary">
                  {c.title}
                </h3>
                <p className="mt-3 text-[14.5px] leading-[1.9] text-text-secondary break-keep">
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-[6vw] mars-section min-h-screen flex flex-col items-center justify-center text-center overflow-hidden">
        <div
          className="mars-glow-bg"
          style={{
            width: 760,
            height: 760,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%,-50%)',
          }}
        />
        <div className="relative z-[1]">
          <h2
            className="mars-reveal mars-display m-0 mb-6"
            style={{ fontSize: 'clamp(36px,5vw,62px)' }}
          >
            지금 <span className="text-brand">시작</span>해보세요
          </h2>
          <p className="mars-reveal mx-auto max-w-[460px] text-[17px] text-text-secondary font-semibold leading-relaxed break-keep">
            해병대의 모든 규정을, 대화 한 번으로.
            <br />
            MARS가 장병 여러분과 함께합니다.
          </p>
        </div>
      </section>
    </>
  )
}
