import { useNavigate } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import LandingFooter from '../ui/components/landing/LandingFooter'
import ScrollFade from '../features/team/ScrollFade'
import { MEMBERS, MILESTONES, type Member } from '../features/team/members'

export default function TeamPage() {
  useDocumentTitle('팀 소개')
  const navigate = useNavigate()

  return (
    <div className="team-page relative min-h-screen">
      {/* 어두운 본문 구간 — 배경은 여기까지만 깔린다(아래 흰 푸터를 덮지 않게). */}
      <div className="team-dark">
      {/* 배경 : 본문 구간 안에 고정. 스크롤해도 같은 화면 안에 있는 느낌을 준다. */}
      <div className="team-bg" aria-hidden>
        <span className="team-bg-glow" />
        <span className="team-bg-grid" />
      </div>

      {/* 상단 — 최소한만. 로고와 나가는 길 하나. */}
      {/* 로고 위치·크기는 로그인(랜딩) 네비(.mars-nav)와 같은 값으로 맞춘다.
          색만 어두운 배경에 맞춰 흰색으로 바꾼다. */}
      <header
        style={{ padding: '14px clamp(20px, 6vw, 64px)' }}
        className="relative z-20 flex items-center"
      >
        <button
          onClick={() => navigate('/')}
          className="text-[20px] font-extrabold tracking-[0.02em] text-white transition-opacity hover:opacity-70"
        >
          MARS
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="ml-auto rounded-full border border-white/25 px-4 py-2 text-[13px] font-semibold text-white/80 transition-colors hover:border-white/60 hover:text-white"
        >
          시작하기
        </button>
      </header>

      <main className="relative z-10">
        {/* 1. 히어로 */}
        <section className="team-sec flex items-center justify-center px-[6vw] text-center">
          <ScrollFade>
            <p className="team-eyebrow">AI DATA TF</p>
            <h1 className="mt-7 text-[clamp(30px,5vw,58px)] font-black leading-[1.28] tracking-[-0.035em] text-white break-keep">
              해병대의 규정을
              <br />
              <span className="text-[#ff3d5e]">해병대가 직접 다룹니다</span>
            </h1>
            <p className="mx-auto mt-8 max-w-[520px] text-[clamp(15px,1.6vw,17.5px)] leading-[1.9] text-white/55 break-keep">
              밖으로 내보낼 수 없는 문서라, 밖에서는 만들 수 없습니다.
              해병대사령부 AI DATA TF가 부대 안에서 만들고 있습니다.
            </p>
          </ScrollFade>

          <span className="team-scroll absolute bottom-10 left-1/2 -translate-x-1/2 text-white/30" aria-hidden>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M6 13l6 6 6-6" />
            </svg>
          </span>
        </section>

        {/* 2. 문제 */}
        <section className="team-sec flex items-center px-[6vw]">
          <ScrollFade className="mx-auto w-full max-w-[760px]">
            <p className="team-eyebrow">THE SOLUTION</p>
            <h2 className="mt-7 text-[clamp(24px,3.6vw,42px)] font-black leading-[1.4] tracking-[-0.035em] text-white break-keep">
              수백 쪽짜리 규정집
              <br />
              <span className="text-white/40">찾지 말고 질문하세요.</span>
            </h2>
            <p className="mt-9 text-[clamp(14.5px,1.5vw,17px)] leading-[2] text-white/55 break-keep">
              수백 쪽짜리 규정집, 흩어진 훈령과 지침. 담당자에게 몇 번씩 되묻다
              결국 그냥 넘어가는 일이 반복됩니다. 몰라서 손해 보는 장병이
              생기는 건 그다음입니다.
            </p>
          </ScrollFade>
        </section>

        {/* 3. 우리가 하는 일 */}
        <section className="team-sec flex items-center px-[6vw]">
          <div className="mx-auto w-full max-w-[900px]">
            <ScrollFade>
              <p className="team-eyebrow">What We Do</p>
              <h2 className="mt-7 text-[clamp(24px,3.6vw,42px)] font-black leading-[1.35] tracking-[-0.035em] text-white break-keep">
                우리가 하는 일
              </h2>
            </ScrollFade>

            <div className="mt-14 flex flex-col">
              {[
                {
                  n: '01',
                  t: '규정 찾는 시간을 크게 줄여줍니다',
                  d: '일일이 찾아보지 않아도, 질문 한 번으로 필요한 내용을 바로 확인할 수 있습니다.',
                },
                {
                  n: '02',
                  t: '근거 없는 답은 내보내지 않습니다',
                  d: '답변에 조·항·호를 함께 붙입니다. 근거를 못 찾으면 추측하는 대신 못 찾았다고 답하게 합니다.',
                },
                {
                  n: '03',
                  t: '언제든 바로 질문할 수 있습니다',
                  d: '필요할 때 바로 물어보고, 기다리지 않고 답을 받을 수 있습니다.',
                },
              ].map((r) => (
                <ScrollFade key={r.n}>
                  <div className="flex gap-6 border-t border-white/10 py-8 sm:gap-10">
                    <span className="shrink-0 pt-1 text-[13px] font-black tabular-nums text-[#ff3d5e]">
                      {r.n}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[clamp(17px,2vw,22px)] font-bold tracking-[-0.02em] text-white break-keep">
                        {r.t}
                      </p>
                      <p className="mt-3 text-[14px] leading-[1.9] text-white/50 break-keep">{r.d}</p>
                    </div>
                  </div>
                </ScrollFade>
              ))}
            </div>
          </div>
        </section>

        {/* 4. 숫자 */}
        <section className="team-sec flex items-center px-[6vw]">
          <div className="mx-auto w-full max-w-[900px]">
            <ScrollFade>
              <p className="team-eyebrow">By the Numbers</p>
            </ScrollFade>

            <div className="mt-12 grid grid-cols-1 gap-y-12 sm:grid-cols-3 sm:gap-x-8">
              {[
                { v: '7', u: '명', l: '기획 · 프론트엔드 · 백엔드 · 디자인' },
                { v: '5', u: '개월+', l: '2026년 3월부터 지금까지' },
                { v: '1', u: '회', l: '2026 인공지능 경진대회 수상' },
              ].map((s) => (
                <ScrollFade key={s.l}>
                  <p className="flex items-baseline gap-1.5">
                    <span className="text-[clamp(46px,6.5vw,74px)] font-black leading-none tracking-[-0.05em] text-white">
                      {s.v}
                    </span>
                    <span className="text-[clamp(17px,2vw,23px)] font-bold text-[#ff3d5e]">{s.u}</span>
                  </p>
                  <p className="mt-4 text-[13px] leading-[1.8] text-white/45 break-keep">{s.l}</p>
                </ScrollFade>
              ))}
            </div>
          </div>
        </section>

        {/* 5. 연혁 */}
        <section className="team-sec flex items-center px-[6vw]">
          <div className="mx-auto w-full max-w-[760px]">
            <ScrollFade>
              <p className="team-eyebrow">History</p>
              <h2 className="mt-7 text-[clamp(24px,3.6vw,42px)] font-black tracking-[-0.035em] text-white break-keep">
                연혁
              </h2>
            </ScrollFade>

            <ol className="mt-14 flex flex-col">
              {MILESTONES.map((m) => (
                <ScrollFade key={m.date}>
                  <li className="team-ms relative pt-6.5 flex gap-6 pb-12 last:pb-0 sm:gap-8">
                    <span className="w-[76px] shrink-0 pt-0.5 text-right text-[12.5px] font-bold tabular-nums text-white/40">
                      {m.year}.{m.date}
                    </span>
                    <span className="team-dot relative shrink-0" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-[17px] font-bold tracking-[-0.015em] text-white break-keep">
                        {m.title}
                      </p>
                    </div>
                  </li>
                </ScrollFade>
              ))}
            </ol>
          </div>
        </section>

        {/* 6. 팀원 */}
        <section className="team-sec flex items-center px-[6vw]">
          <div className="mx-auto w-full max-w-[1000px]">
            <ScrollFade className="text-center">
              <p className="team-eyebrow justify-center">Members</p>
              <h2 className="mt-7 text-[clamp(24px,3.6vw,42px)] font-black tracking-[-0.035em] text-white break-keep">
                AI DATA TF
              </h2>
              <p className="mt-5 text-[13.5px] leading-[1.8] text-white/45 break-keep">
                해병대사령부 지휘통신참모처 지능정보화발전과
              </p>
            </ScrollFade>

            <div className="mt-16 grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-4">
              {MEMBERS.map((m) => (
                <ScrollFade key={`${m.cohort}-${m.name}`}>
                  <MemberCard member={m} />
                </ScrollFade>
              ))}
            </div>
          </div>
        </section>

        {/* 7. 마무리 */}
        <section className="team-sec flex items-center justify-center px-[6vw] text-center">
          <ScrollFade>
            <h2 className="text-[clamp(26px,4vw,46px)] font-black leading-[1.35] tracking-[-0.035em] text-white break-keep">
              직접 써보시는 게
              <br />
              가장 빠릅니다
            </h2>
            <p className="mx-auto mt-7 max-w-[400px] text-[15px] leading-[1.9] text-white/50 break-keep">
              궁금한 규정을 평소 말하듯 물어보세요.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="team-cta mt-10 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[14.5px] font-bold text-white"
            >
              MARS 시작하기 <span aria-hidden>→</span>
            </button>
          </ScrollFade>
        </section>
      </main>
      </div>

      {/* 하단 — 다른 페이지와 같은 랜딩 푸터.
          검정에서 흰색으로 그라디언트를 넣으면 회색 안개처럼 뭉개져 지저분하다.
          경계는 그냥 딱 끊는 편이 깔끔하다(섹션이 끝났다는 신호로도 읽힌다). */}
      <div className="relative z-10 bg-white">
        <LandingFooter />
      </div>
    </div>
  )
}

/** 팀원 한 명. 사진이 없으면 이니셜 원으로 대신한다. */
function MemberCard({ member }: { member: Member }) {
  return (
    <div className="team-member flex flex-col items-center text-center">
      {/* 프로필 자리 — 사진이 준비되면 members.ts 의 photo에 경로를 넣는다. */}
      <span
        className="team-avatar relative flex items-center justify-center overflow-hidden rounded-full"
        style={{ width: 92, height: 92 }}
      >
        {member.photo ? (
          <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[26px] font-black tracking-[-0.02em] text-white/85">
            {member.name.charAt(0)}
          </span>
        )}
      </span>

      <p className="mt-5 text-[15px] font-bold tracking-[-0.01em] text-white">{member.name}</p>
      <p className="mt-1 text-[11.5px] font-medium text-white/35">{member.cohort}</p>

      <span className="mt-3 flex flex-wrap items-center justify-center gap-1">
        {member.roles.map((r) => (
          <span
            key={r}
            className="rounded-full border border-white/12 px-2.5 py-1 text-[11px] font-semibold text-white/55"
          >
            {r}
          </span>
        ))}
      </span>
    </div>
  )
}
