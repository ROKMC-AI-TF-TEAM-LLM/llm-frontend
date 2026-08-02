import { useNavigate } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import LandingFooter from '../ui/components/landing/LandingFooter'
import { Reveal, TutorialHeader } from '../features/tutorials/parts'
import { MEMBERS, MILESTONES, type Member } from '../features/team/members'

/**
 * 팀 소개 — AI DATA TF.
 *
 * 서비스(MARS) 설명이 아니라 '팀'을 이야기하는 페이지다.
 * 토스 팀 페이지처럼 섹션마다 한 화면을 꽉 채워, 스크롤할 때마다
 * 장면이 하나씩 바뀌는 리듬을 만든다.
 *
 * 구성 : 히어로 → 숫자 → 팀 미션 → 연혁 → 팀원 → CTA → 푸터
 */
export default function TeamPage() {
  useDocumentTitle('팀 소개')
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      <TutorialHeader />

      {/* ── 1. 히어로 ── */}
      <section className="team-hero team-screen relative flex items-center justify-center overflow-hidden px-[6vw]">
        <span className="team-hero-glow" aria-hidden />
        <span className="team-hero-grid" aria-hidden />

        <Reveal className="relative z-[2] text-center">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-[#ff5d78]">
            AI DATA TF
          </p>
          <h1 className="mt-6 text-[clamp(32px,5.4vw,60px)] font-black leading-[1.25] tracking-[-0.03em] text-white break-keep">
            군에서도,
            <br />
            <span className="text-[#ff4d6a]">우리가 만들 수 있습니다</span>
          </h1>
          <p className="mx-auto mt-7 max-w-[540px] text-[clamp(15px,1.6vw,18px)] leading-[1.8] text-[#c8bcc0] break-keep">
            현역 장병 7명이 모여 부대의 문제를 직접 코드로 풀고 있습니다.
            외주도, 구매도 아닌 우리 손으로.
          </p>
        </Reveal>

        <span className="team-scroll absolute bottom-9 left-1/2 -translate-x-1/2 text-[#8d7f84]" aria-hidden>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M6 13l6 6 6-6" />
          </svg>
        </span>
      </section>

      {/* ── 2. 숫자로 보는 팀 ── */}
      <section className="team-screen flex items-center bg-white px-[6vw]">
        <div className="mx-auto w-full max-w-[1000px]">
          <Reveal>
            <h2 className="text-[clamp(24px,3.4vw,38px)] font-black leading-[1.4] tracking-[-0.03em] text-text-primary break-keep">
              작은 팀이지만,
              <br />
              하는 일은 작지 않습니다
            </h2>
          </Reveal>

          <div className="mt-16 grid grid-cols-1 gap-y-14 sm:grid-cols-3 sm:gap-x-8">
            {[
              { label: '팀원', value: '7', unit: '명', note: '기획 · 프론트엔드 · 백엔드 · 디자인' },
              { label: '개발 기간', value: '5', unit: '개월+', note: '2026.03 ~ 현재' },
              { label: '수상', value: '1', unit: '회', note: '2026 인공지능 경진대회' },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 90}>
                <div>
                  <p className="text-[13px] font-semibold text-text-muted">{s.label}</p>
                  <p className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-[clamp(44px,6vw,68px)] font-black leading-none tracking-[-0.04em] text-text-primary">
                      {s.value}
                    </span>
                    <span className="text-[clamp(18px,2vw,24px)] font-bold text-brand">{s.unit}</span>
                  </p>
                  <p className="mt-4 text-[13px] leading-[1.7] text-text-secondary break-keep">{s.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. 팀 미션 (어두운 판) ── */}
      <section className="team-screen relative flex items-center overflow-hidden bg-[#17111a] px-[6vw]">
        <span className="team-hero-glow" aria-hidden />
        <Reveal className="relative z-[2] mx-auto max-w-[760px] text-center">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-[#ff5d78]">
            Team Mission
          </p>
          <p className="mt-8 text-[clamp(20px,2.6vw,30px)] font-bold leading-[1.65] tracking-[-0.02em] text-white break-keep">
            부대의 불편은 부대를 가장 잘 아는 사람이
            <br />
            가장 잘 고칠 수 있다고 믿습니다.
          </p>
          <p className="mt-8 text-[clamp(14px,1.5vw,16px)] leading-[1.95] text-[#bbaeb3] break-keep">
            규정을 찾느라 반나절을 쓰는 것도, 담당자에게 몇 번씩 되묻는 것도
            겪어본 사람만 아는 불편입니다.
            <br className="hidden sm:block" />
            그 불편을 직접 겪은 우리가, 직접 만들어 해결합니다.
          </p>
        </Reveal>
      </section>

      {/* ── 4. 연혁 ── */}
      <section className="team-screen flex items-center bg-white px-[6vw]">
        <div className="mx-auto w-full max-w-[820px]">
          <Reveal>
            <h2 className="text-[clamp(24px,3.4vw,38px)] font-black tracking-[-0.03em] text-text-primary break-keep">
              지나온 길
            </h2>
          </Reveal>

          <ol className="mt-14 flex flex-col">
            {MILESTONES.map((m, i) => (
              <Reveal key={m.date} delay={i * 90}>
                <li className="team-milestone relative flex gap-7 pb-11 last:pb-0">
                  {/* 세로선 + 점 */}
                  <span className="relative flex w-[70px] shrink-0 justify-end pt-0.5">
                    <span className="text-[13px] font-bold tabular-nums text-text-muted">
                      {m.year}.{m.date}
                    </span>
                  </span>
                  <span className="team-dot relative shrink-0" aria-hidden />

                  <div className="min-w-0 flex-1 pb-1">
                    <p className="text-[17px] font-bold tracking-[-0.01em] text-text-primary break-keep">
                      {m.title}
                    </p>
                    <p className="mt-2 text-[13.5px] leading-[1.8] text-text-secondary break-keep">
                      {m.desc}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 5. 팀원 ── */}
      <section className="team-screen flex items-center bg-white px-[6vw]">
        <div className="mx-auto w-full max-w-[1100px]">
          <Reveal className="text-center">
            <h2 className="text-[clamp(24px,3.4vw,38px)] font-black tracking-[-0.03em] text-text-primary break-keep">
              함께 만드는 사람들
            </h2>
            <p className="mt-4 text-[14.5px] leading-[1.8] text-text-secondary break-keep">
              해병대사령부 지휘통신참모처 지능정보화발전과 AI DATA TF
            </p>
          </Reveal>

          <div className="mt-14 grid grid-cols-2 gap-x-5 gap-y-11 sm:grid-cols-4">
            {MEMBERS.map((m, i) => (
              <Reveal key={`${m.cohort}-${m.name}`} delay={i * 55}>
                <MemberCard member={m} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. 마무리 CTA ── */}
      <section className="border-t border-[#f4eced] bg-[#fdfbfb] px-[6vw] py-24 text-center">
        <Reveal>
          <h2 className="text-[clamp(24px,3.2vw,36px)] font-black tracking-[-0.03em] text-text-primary">
            지금 <span className="text-brand">시작</span>해보세요
          </h2>
          <p className="mx-auto mt-4 max-w-[440px] text-[15px] leading-relaxed text-text-secondary break-keep">
            해병대의 모든 규정을, 대화 한 번으로.
          </p>
          <button type="button" onClick={() => navigate('/')} className="mars-pill mars-pill-brand mt-8">
            MARS 시작하기 <span aria-hidden>→</span>
          </button>
        </Reveal>
      </section>

      <LandingFooter />
    </div>
  )
}

/** 팀원 한 명. 사진이 없으면 이니셜 원으로 대신한다. */
function MemberCard({ member }: { member: Member }) {
  return (
    <div className="team-member flex flex-col items-center text-center">
      {/* 프로필 — 사진이 들어올 자리. 지금은 이니셜 원. */}
      <span
        className="team-avatar relative flex items-center justify-center overflow-hidden rounded-full"
        style={{ width: 96, height: 96, background: member.photo ? undefined : member.tint }}
      >
        {member.photo ? (
          <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[28px] font-black tracking-[-0.02em] text-white/95">
            {member.name.charAt(0)}
          </span>
        )}
      </span>

      <p className="mt-5 text-[15.5px] font-bold tracking-[-0.01em] text-text-primary">{member.name}</p>
      <p className="mt-1 text-[12px] font-medium text-text-muted">{member.cohort}</p>

      <span className="mt-3 flex flex-wrap items-center justify-center gap-1">
        {member.roles.map((r) => (
          <span
            key={r}
            className="rounded-full bg-[#faf6f7] px-2.5 py-1 text-[11.5px] font-semibold text-text-secondary"
          >
            {r}
          </span>
        ))}
      </span>
    </div>
  )
}
