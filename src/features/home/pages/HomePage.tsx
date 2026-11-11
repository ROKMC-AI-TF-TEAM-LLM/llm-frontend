import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRevealOnScroll } from '@/shared/hooks/useRevealOnScroll'
import MarsPlanet from '@/features/landing/components/MarsPlanet'
import RotatingWord from '@/features/landing/components/RotatingWord'
import LandingNav from '@/features/landing/components/LandingNav'
import LandingFooter from '@/features/landing/components/LandingFooter'
import {
  AuthPanel,
  type AuthPanelHandle,
} from '@/features/auth/components/AuthPanel'
import { IntroSections } from '../components/IntroSections'

const HERO_VERBS = ['물어보세요', '찾아보세요', '확인하세요', '정리하세요']

const HomePage = () => {
  const navigate = useNavigate()
  const [view, setView] = useState<'intro' | 'auth'>('intro')

  const introRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const authRef = useRef<AuthPanelHandle>(null)

  // 로그인 창을 열 때마다 빈 로그인 폼에서 시작한다
  const showAuth = () => {
    authRef.current?.reset()
    setView('auth')
  }
  const openAuth = () => {
    const el = introRef.current
    if (!el || el.scrollTop <= 4) {
      showAuth()
      return
    }
    let done = false
    const finish = () => {
      if (done) return
      done = true
      clearTimeout(t)
      el.removeEventListener('scroll', onScroll)
      showAuth()
    }
    const onScroll = () => {
      if (el.scrollTop <= 4) finish()
    }
    const t = window.setTimeout(finish, 1000)
    el.addEventListener('scroll', onScroll, { passive: true })
    el.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const closeAuth = () => {
    setView('intro')
    requestAnimationFrame(() =>
      introRef.current?.scrollTo({ top: 0, behavior: 'smooth' }),
    )
  }
  const scrollToFeatures = () =>
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' })

  useRevealOnScroll(introRef)

  return (
    <div className="mars-root" data-view={view}>
      <LandingNav onStart={openAuth} />
      <div ref={introRef} className="mars-intro ">
        <section className="mars-hero mars-section relative flex items-center min-h-screen px-[6vw] pt-20">
          <div className="mars-glow-bg w-[620px] h-[620px] right-[-6%] top-[2%]" />
          <div className="max-w-[640px] relative z-[1]">
            <div className="mars-reveal mars-eyebrow mars-eyebrow-full mb-5">
              Marine Artificial Intelligence Reasoning System
            </div>
            <h1 className="mars-reveal mars-wordmark mars-display mars-brand-serif -ml-1 m-0 text-brand text-glow-brand">
              MARS
            </h1>
            <p className="mars-reveal mars-display mt-1 text-text-primary text-[length:clamp(26px,3vw,38px)]">
              해병대의 모든 규정을,
              <br />
              한 번에 <RotatingWord words={HERO_VERBS} />
            </p>
            <p className="mars-reveal font-semibold mt-5 text-[16.5px] leading-[1.7] text-text-secondary max-w-[420px] break-keep">
              법령·규정·규칙을 참조해 장병의 질문에 근거와 함께 답합니다.
            </p>
            <div className="mars-reveal mt-8 relative h-[52px]">
              <div
                className={`absolute inset-0 flex items-center gap-3 transition-opacity duration-500 ${view === 'intro' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                <button
                  onClick={openAuth}
                  className="mars-pill mars-pill-brand"
                >
                  MARS 시작하기 <span aria-hidden>→</span>
                </button>
              </div>
              <div
                className={`absolute inset-0 flex items-center gap-3 transition-opacity duration-500 ${view === 'auth' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                <button
                  type="button"
                  onClick={() => navigate('/team')}
                  className="mars-pill mars-pill-ghost mars-brand-serif text-[14px]"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  팀 소개
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/guide')}
                  className="mars-pill mars-pill-ghost mars-brand-serif text-[14px]"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
                  </svg>
                  서비스 이용법
                </button>
              </div>
            </div>
          </div>

          <div className="mars-hero-planet">
            <div className="mars-hero-planet-inner">
              <div className="mars-planet-float">
                <div className="mars-planet-body">
                  <div className="mars-orbit o1" />
                  <div className="mars-orbit o2" />
                  <MarsPlanet glow className="w-full h-full" />
                </div>
              </div>
            </div>
          </div>

          {view === 'intro' && (
            <button
              onClick={scrollToFeatures}
              className="absolute left-1/2 -translate-x-1/2 bottom-8 flex flex-col items-center gap-1.5 text-text-muted hover:text-brand transition-colors"
            >
              <span className="text-[13px] font-semibold tracking-wide">
                더 알아보기
              </span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-[marsBob_1.7s_ease-in-out_infinite]"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          )}
        </section>

        <div className="mars-below">
          <IntroSections featuresRef={featuresRef} />

          <LandingFooter onStart={openAuth} />
        </div>
      </div>

      <AuthPanel ref={authRef} onClose={closeAuth} />
    </div>
  )
}

export default HomePage
