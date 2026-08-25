import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm as useHookForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../context/AuthContext'
import { signup } from '../api/services/auth'
import MarsPlanet from '../ui/components/MarsPlanet'
import { showToast } from '../api/store/toastStore'
import RotatingWord from '../ui/components/landing/RotatingWord'
import LandingNav from '../ui/components/landing/LandingNav'
import LandingFooter from '../ui/components/landing/LandingFooter'
import { getApiError, isNetworkError, DEFAULT_STATUS_ERRORS } from '../utils/error'
import { logError } from '../utils/logError'

const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i

const loginSchema = z.object({
  email: z.string().min(1, '이메일을 입력해주세요.').refine((v) => EMAIL_REGEX.test(v), '이메일 형식이 올바르지 않습니다.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
})
const signupSchema = z.object({
  email: z.string().min(1, '이메일을 입력해주세요.').refine((v) => EMAIL_REGEX.test(v), '유효한 이메일 주소를 입력해주세요.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
  passwordCheck: z.string(),
  name: z.string().min(1, '이름을 입력해주세요.'),
}).refine((data) => data.password === data.passwordCheck, { message: '비밀번호가 일치하지 않습니다.', path: ['passwordCheck'] })

type LoginFields = z.infer<typeof loginSchema>
type SignupFields = z.infer<typeof signupSchema>

const LOGIN_ERRORS: Record<string, string> = {
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
  TOKEN_INVALID: '유효하지 않은 토큰입니다. 다시 로그인해주세요.',
  APPROVAL_PENDING: '관리자 승인 대기 중인 계정입니다.',
  APPROVAL_REJECTED: '관리자에 의해 승인이 거절된 계정입니다.',
  ADMIN_REQUIRED: '관리자 권한이 필요합니다.',
  USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
}
const SIGNUP_ERRORS: Record<string, string> = { EMAIL_ALREADY_EXISTS: '이미 사용 중인 이메일입니다.' }

type IconType = 'learn' | 'source' | 'update' | 'domain' | 'stream' | 'doc'
const FeatureIcon = ({ type }: { type: IconType }) => {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (type === 'learn') return (<svg {...common}><path d="M12 3l7 3v5c0 4.2-2.8 7.4-7 9-4.2-1.6-7-4.8-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>)
  if (type === 'source') return (<svg {...common}><path d="M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z" /><path d="M14 3v6h6M8 13h8M8 17h6" /></svg>)
  if (type === 'domain') return (<svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.6" /><rect x="14" y="3" width="7" height="7" rx="1.6" /><rect x="3" y="14" width="7" height="7" rx="1.6" /><path d="M14 17.5h7M17.5 14v7" /></svg>)
  if (type === 'stream') return (<svg {...common}><path d="M3 12h4l2.5-6 5 12L17 12h4" /></svg>)
  if (type === 'doc') return (<svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>)
  return (<svg {...common}><path d="M21 12a9 9 0 1 1-2.6-6.3M21 4v5h-5" /></svg>)
}

const HERO_VERBS = ['물어보세요', '찾아보세요', '확인하세요', '정리하세요']

const FEATURES: { icon: IconType; title: string; desc: string }[] = [
  { icon: 'learn', title: '해병대 특화', desc: '병영생활·인사·복무 규정 등 우리 군 실무 문서를 참조해 부대 맥락에 맞게 답합니다.' },
  { icon: 'source', title: '출처 기반 답변', desc: 'RAG 검색으로 실제 규정 원문을 찾아 근거·조항과 함께 답변해 신뢰할 수 있습니다.' },
  { icon: 'domain', title: '도메인별 검색', desc: '인사·복지, 정보화·보안 등 분야를 좁히면 엉뚱한 문서가 섞이지 않아 정확해집니다.' },
  { icon: 'stream', title: '실시간 스트리밍', desc: '답이 완성될 때까지 기다리지 않고, 찾는 과정과 결과를 즉시 보여줍니다.' },
  { icon: 'doc', title: '문서함 직접 열람', desc: '대화 없이도 카테고리와 검색어로 전체 규정 문서를 바로 찾아볼 수 있습니다.' },
  { icon: 'update', title: '최신 규정 반영', desc: '개정된 법령·지침을 문서 저장소에 반영해 언제나 최신 기준으로 안내합니다.' },
]

const LoginPage = () => {
  const navigate = useNavigate()
  const [view, setView] = useState<'intro' | 'auth'>('intro')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const { login } = useAuth()

  const introRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)

  const {
    register: registerLogin, handleSubmit: handleLoginSubmit, reset: resetLogin, watch: watchLogin,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
  } = useHookForm<LoginFields>({ defaultValues: { email: '', password: '' }, resolver: zodResolver(loginSchema), mode: 'onBlur' })
  const loginValues = watchLogin()
  const isLoginDisabled = isLoginSubmitting || Object.values(loginValues).some((v) => v === '')

  const {
    register: registerSignup, handleSubmit: handleSignupSubmit, reset: resetSignup, watch: watchSignup,
    formState: { errors: signupErrors, isSubmitting: isSignupSubmitting },
  } = useHookForm<SignupFields>({ defaultValues: { name: '', email: '', password: '', passwordCheck: '' }, resolver: zodResolver(signupSchema), mode: 'onBlur' })
  const signupValues = watchSignup()
  const isSignupDisabled = isSignupSubmitting || Object.values(signupValues).some((v) => v === '')

  const handleLogin: SubmitHandler<LoginFields> = async (data) => {
    try { await login(data) }
    catch (error) {
      logError('login', error)
      if (isNetworkError(error)) { showToast('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'); return }
      showToast(getApiError(error, LOGIN_ERRORS, DEFAULT_STATUS_ERRORS, '로그인 중 오류가 발생했습니다.'))
    }
  }
  const handleSignup: SubmitHandler<SignupFields> = async (data) => {
    const { passwordCheck: _pw, ...rest } = data
    void _pw
    try { await signup(rest); showToast('회원가입이 완료되었습니다.', 'success'); setMode('login') }
    catch (error) {
      logError('signup', error)
      if (isNetworkError(error)) { showToast('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'); return }
      showToast(getApiError(error, SIGNUP_ERRORS, {}, '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.'))
    }
  }

  const openAuth = () => {
    const el = introRef.current
    if (!el || el.scrollTop <= 4) { setView('auth'); return }
    let done = false
    const finish = () => {
      if (done) return
      done = true
      clearTimeout(t)
      el.removeEventListener('scroll', onScroll)
      setView('auth')
    }
    const onScroll = () => { if (el.scrollTop <= 4) finish() }
    const t = window.setTimeout(finish, 1000)
    el.addEventListener('scroll', onScroll, { passive: true })
    el.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const closeAuth = () => { setView('intro'); requestAnimationFrame(() => introRef.current?.scrollTo({ top: 0, behavior: 'smooth' })) }
  const scrollToFeatures = () => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })

  useLayoutEffect(() => {
    if (view !== 'auth') return
    resetLogin()
    resetSignup()
    setMode('login')
  }, [view, resetLogin, resetSignup])

  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-shown'); io.unobserve(e.target) } })
    }, { threshold: 0.15 })
    introRef.current?.querySelectorAll('.mars-reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const fieldCls = 'w-full px-5 py-3.5 rounded-full border border-surface-border bg-white text-sm text-text-primary outline-none focus:border-brand transition-colors'

  return (
    <div className="mars-root" data-view={view}>
      <LandingNav onStart={openAuth} />
      <div ref={introRef} className="mars-intro ">
        <section className="mars-hero mars-section relative flex items-center min-h-screen px-[6vw] pt-20">
          <div className="mars-glow-bg" style={{ width: 620, height: 620, right: '-6%', top: '2%' }} />
          <div className="max-w-[640px] relative z-[1]">
            <div className="mars-reveal mars-eyebrow mars-eyebrow-full mb-5">
              Marine Artificial Intelligence Reasoning System
            </div>
            <h1 className="mars-reveal mars-wordmark mars-display -ml-1 m-0 text-brand text-glow-brand">MARS</h1>
            <p className="mars-reveal mars-display mt-5 text-text-primary" style={{ fontSize: 'clamp(26px,3vw,38px)' }}>
              해병대의 모든 규정을,<br />
              한 번에 <RotatingWord words={HERO_VERBS} />
            </p>
            <p className="mars-reveal mt-5 text-[16.5px] leading-[1.7] text-text-secondary max-w-[420px] break-keep">
              법령·규정·규칙을 참조해 장병의 질문에 근거와 함께 답합니다.
            </p>
            <div className="mars-reveal mt-8 relative h-[52px]">
              <div className={`absolute inset-0 flex items-center gap-3 transition-opacity duration-500 ${view === 'intro' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <button onClick={openAuth} className="mars-pill mars-pill-brand">
                  MARS 시작하기 <span aria-hidden>→</span>
                </button>
              </div>
              <div className={`absolute inset-0 flex items-center gap-3 transition-opacity duration-500 ${view === 'auth' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <button type="button" onClick={() => showToast('개발 중인 페이지입니다.')} className="mars-pill mars-pill-ghost text-[14px]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  팀 소개
                </button>
                <button type="button" onClick={() => navigate('/guide')} className="mars-pill mars-pill-ghost text-[14px]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" /></svg>
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
                  <MarsPlanet glow className="w-full h-full" />
                </div>
              </div>
            </div>
          </div>

          {view === 'intro' && (
          <button onClick={scrollToFeatures} className="absolute left-1/2 -translate-x-1/2 bottom-8 flex flex-col items-center gap-1.5 text-text-muted hover:text-brand transition-colors">
            <span className="text-[13px] font-semibold tracking-wide">더 알아보기</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'marsBob 1.7s ease-in-out infinite' }}><path d="M6 9l6 6 6-6" /></svg>
          </button>
          )}
        </section>

        <div className="mars-below">
        <section ref={featuresRef} className="mars-section px-[6vw] py-20 min-h-screen flex flex-col justify-center">
          <div className="max-w-[1180px] mx-auto w-full">
            <div className="mars-reveal mars-eyebrow mb-4">가장 큰 특징</div>
            <h2 className="mars-reveal mars-display max-w-[820px]" style={{ fontSize: 'clamp(27px,3.2vw,42px)' }}>
              법령, 규정, 규칙을<br /><span className="text-brand">인공지능</span>이 찾아냅니다.
            </h2>
            <p className="mars-reveal max-w-[560px] mt-4 mb-10 text-[16px] text-text-secondary leading-[1.7] break-keep">
              MARS는 해병대 실무 문서를 근거로 답하며, 모든 답변에 출처를 함께 제시합니다.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {FEATURES.map((f) => (
                <div key={f.title} className="mars-reveal mars-card p-5">
                  <div className="w-9 h-9 rounded-lg bg-brand-subtle border border-brand-soft flex items-center justify-center mb-3.5 text-brand">
                    <FeatureIcon type={f.icon} />
                  </div>
                  <div className="text-[15.5px] font-extrabold mb-1.5 tracking-tight">{f.title}</div>
                  <div className="text-[13.5px] text-text-secondary leading-[1.65] break-keep">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-[6vw] mars-section min-h-screen flex flex-col justify-center py-20">
          <div className="max-w-[1280px] mx-auto w-full flex flex-col lg:flex-row gap-14 items-center">

            <div className="flex-1 min-w-0">
              <div className="mars-reveal mars-eyebrow mb-5">동작 방식</div>
              <h2 className="mars-reveal mars-display mb-6" style={{ fontSize: 'clamp(30px,3.6vw,48px)' }}>
                추측하지 않고,<br /><span className="text-brand">찾아서</span> 답합니다.
              </h2>
              <p className="mars-reveal text-[17px] text-text-secondary leading-relaxed mb-12 max-w-[400px] break-keep">
                궁금한 규정과 절차를 평소 말하듯 입력하면, MARS가 원문 조항을 찾아 대조한 뒤 근거와 함께 답합니다.
              </p>
              <div className="flex flex-col gap-7">
                {[['STEP 01', '질문 입력', '궁금한 규정·절차를 평소 말하듯 입력합니다.'], ['STEP 02', '문서 검색·대조', 'MARS가 관련 규정 문서를 찾아 원문 조항을 대조합니다.'], ['STEP 03', '근거와 함께 답변', '어떤 문서 몇 조를 참고했는지 출처와 함께 답합니다.']].map(([s, t, d]) => (
                  <div key={s} className="mars-reveal flex gap-5 items-start">
                    <span className="shrink-0 text-[12px] font-extrabold text-brand tracking-[0.1em] pt-1 w-14">{s}</span>
                    <div>
                      <div className="text-[17px] font-extrabold mb-1 tracking-tight">{t}</div>
                      <div className="text-[14px] text-text-secondary leading-relaxed break-keep">{d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 min-w-0 w-full">
              <div className="mars-reveal rounded-3xl bg-white border border-brand-soft/60 shadow-[0_30px_70px_rgba(150,0,40,0.10)] overflow-hidden">
                <div className="p-7 pb-4 flex flex-col gap-5">
                  <div className="self-end max-w-[72%] px-5 py-3 rounded-[20px_20px_6px_20px] bg-gradient-to-br from-brand to-brand-light text-white text-[15px] leading-relaxed shadow-[0_10px_22px_rgba(220,20,60,0.2)]">야간근무 수당은 어떻게 지급되나요?</div>
                  <div className="text-[15px] leading-relaxed text-text-primary">
                    <b className="font-extrabold">야간근무 수당</b>은 다음 기준으로 지급됩니다.
                    <div className="mt-3.5 flex flex-col gap-2.5">
                      {['22시부터 익일 06시 사이 근무가 대상입니다.', '시간당 통상임금의 50%를 가산해 지급합니다.', '근무 기록은 부대 인사담당이 월 단위로 정산합니다.'].map((t, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <span className="shrink-0 w-5 h-5 mt-0.5 rounded-md bg-brand-subtle text-brand text-[11.5px] font-extrabold flex items-center justify-center">{i + 1}</span>
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-subtle text-brand text-xs font-medium rounded-full border border-brand-soft">
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="rotate-180"><path d="m6 9 6 6 6-6" /></svg>
                        출처 2개 닫기
                      </span>
                      <div className="mt-2 flex flex-col gap-2">
                        {[
                          { title: '군인 보수 규정', type: '규정', domain: '재무·법무', dept: '국방부 · 재정관리실', style: { bar: '#e0952b', bg: '#fbf1e2', text: '#b3720f' } },
                          { title: '공무원 수당 등에 관한 규정', type: '법률', domain: '인사·복지', dept: '인사혁신처', style: { bar: '#e4002b', bg: '#fdeef1', text: '#c0002a' } },
                        ].map((s) => (
                          <div key={s.title} className="flex items-center gap-3 p-3 rounded-xl border border-[#f0e6e8] bg-white">
                            <span className="shrink-0 flex items-center justify-center" style={{ width: 38, height: 38, borderRadius: 10, background: s.style.bg, color: s.style.bar }}>
                              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <path d="M14 2v6h6M8 13h8M8 17h5" />
                              </svg>
                            </span>
                            <span className="min-w-0 flex-1 flex items-center gap-2">
                              <span className="shrink-0 text-[14px] font-bold text-text-primary">{s.title}</span>
                              <span className="min-w-0 truncate flex items-center gap-1.5 text-[12px] text-text-muted">
                                <span>{s.type}</span>
                                <span aria-hidden>·</span>
                                <span style={{ color: s.style.text }}>{s.domain}</span>
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
                  <div style={{ border: '1px solid #f0e3e6', boxShadow: '0 12px 30px rgba(160,0,40,0.05)' }} className="bg-white rounded-[30px] overflow-hidden cursor-default select-none">
                    <div className="px-5 pt-6 pb-1 text-[15px] text-text-muted">메시지를 입력하세요...</div>
                    <div className="flex items-center justify-between px-3 pb-3 pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-10 h-10 flex items-center justify-center rounded-full text-text-muted shrink-0">
                          <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                        </span>
                        <span className="inline-flex items-center gap-1.5 pl-2 pr-2.5 h-10 rounded-full text-[13.5px] font-medium text-text-muted">
                          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 7h18M3 12h18M3 17h18" />
                          </svg>
                          <span>전체</span>
                          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                        </span>
                      </div>
                      <div style={{ background: 'linear-gradient(135deg,#e4002b,#ff2d55)', boxShadow: '0 5px 13px rgba(228,0,43,0.28)' }} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" /></svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center pb-5 text-[13px] text-text-muted">MARS는 AI이므로 실수를 할 수 있습니다. 중요한 정보는 재차 확인하십시오.</div>
              </div>
            </div>

          </div>
        </section>

        <section className="px-[6vw] mars-section min-h-screen flex flex-col justify-center py-20">
          <div className="max-w-[1280px] mx-auto w-full flex flex-col lg:flex-row-reverse gap-14 items-center">

            <div className="flex-1 min-w-0">
              <div className="mars-reveal mars-eyebrow mb-5">문서로도 받기</div>
              <h2 className="mars-reveal mars-display mb-6" style={{ fontSize: 'clamp(30px,3.6vw,48px)' }}>
                대화만이 아니라,<br />결과물로 남깁니다.
              </h2>
              <p className="mars-reveal text-[17px] text-text-secondary leading-relaxed mb-12 max-w-[400px] break-keep">
                정리가 필요한 내용은 요청 한 번으로 한글(HWP) 문서로 만들어 바로 내려받을 수 있습니다.
              </p>
              <div className="flex flex-col gap-7">
                {[
                  ['정리 요청', '"~~를 정리한 한글 문서를 만들어줘"처럼 대화하듯 요청합니다.'],
                  ['문서 생성', 'MARS가 답변 내용을 바탕으로 HWP 문서를 작성합니다.'],
                  ['바로 다운로드', '채팅 안에서 완성된 문서를 바로 내려받아 활용합니다.'],
                ].map(([t, d], i) => (
                  <div key={t} className="mars-reveal flex gap-5 items-start">
                    <span className="shrink-0 mt-1 w-6 h-6 rounded-full bg-brand-subtle border border-brand-soft text-brand text-[12px] font-extrabold flex items-center justify-center">{i + 1}</span>
                    <div>
                      <div className="text-[16px] font-bold mb-0.5">{t}</div>
                      <div className="text-[14px] text-text-secondary leading-relaxed break-keep">{d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 min-w-0 w-full">
              <div className="mars-reveal rounded-3xl bg-white border border-brand-soft/60 shadow-[0_30px_70px_rgba(150,0,40,0.10)] overflow-hidden">
                <div className="p-7 flex flex-col gap-5">
                  <div className="self-end max-w-[85%] px-5 py-3 rounded-[20px_20px_6px_20px] bg-gradient-to-br from-brand to-brand-light text-white text-[15px] leading-relaxed shadow-[0_10px_22px_rgba(220,20,60,0.2)]">
                    해병대 창설 배경을 정리한 한글 문서로 만들어줘
                  </div>
                  <div className="text-[15px] leading-relaxed text-text-primary">
                    네, 해병대 창설 배경을 정리한 문서를 만들었습니다. 아래에서 바로 내려받으실 수 있습니다.
                  </div>
                  <div className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-brand-soft bg-brand-subtle">
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-brand flex items-center justify-center">
                      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-text-primary truncate">해병대_창설_배경.hwp</p>
                      <p className="text-[11.5px] text-brand-hover font-medium mt-0.5">HWP · 128KB · 다운로드</p>
                    </div>
                    <svg className="shrink-0 w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        <section className="relative px-[6vw] mars-section min-h-screen flex flex-col items-center justify-center text-center overflow-hidden">
          <div className="mars-glow-bg" style={{ width: 760, height: 760, left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }} />
          <div className="relative z-[1]">
            <h2 className="mars-reveal mars-display m-0 mb-6" style={{ fontSize: 'clamp(36px,5vw,62px)' }}>지금 <span className="text-brand">시작</span>해보세요</h2>
            <p className="mars-reveal mx-auto max-w-[460px] text-[17px] text-text-secondary leading-relaxed break-keep">해병대의 모든 규정을, 대화 한 번으로.<br />MARS가 장병 여러분과 함께합니다.</p>
          </div>
        </section>

        <LandingFooter onStart={openAuth} />
        </div>
      </div>

      <div className="mars-auth-panel">
        <button onClick={closeAuth} aria-label="소개로 돌아가기" className="absolute top-6 right-7 w-11 h-11 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <div className="mars-panel-inner">
          <div className="text-[28px] font-extrabold text-text-primary leading-tight">{mode === 'login' ? '로그인' : '회원가입'}</div>
          <p className="mt-2 text-[14px] text-text-secondary">{mode === 'login' ? '계정으로 로그인하고 MARS를 시작하세요.' : '관리자 승인 후 서비스 이용이 가능합니다.'}</p>

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit(handleLogin)} className="mt-7 flex flex-col gap-3">
              <input type="email" placeholder="이메일" className={fieldCls} {...registerLogin('email')} />
              {loginErrors.email && <p className="text-xs text-brand -mt-1 pl-2">{loginErrors.email.message}</p>}
              <input type="password" placeholder="비밀번호" className={fieldCls} {...registerLogin('password')} />
              {loginErrors.password && <p className="text-xs text-brand -mt-1 pl-2">{loginErrors.password.message}</p>}
              <button type="submit" disabled={isLoginDisabled} className="mt-1.5 w-full py-4 rounded-full bg-gradient-to-r from-brand to-brand-light text-white text-[16px] font-extrabold shadow-[0_14px_30px_rgba(220,20,60,0.3)] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-105 transition">
                {isLoginSubmitting ? '로그인 중...' : '시작하기'}
              </button>
              <div className="flex justify-end mt-1">
                <button type="button" onClick={() => { resetLogin(); resetSignup(); setMode('signup') }} className="text-[13px] font-bold text-text-muted hover:text-brand transition-colors">회원가입</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit(handleSignup)} className="mt-7 flex flex-col gap-3">
              <input type="text" placeholder="이름" className={fieldCls} {...registerSignup('name')} />
              {signupErrors.name && <p className="text-xs text-brand -mt-1 pl-2">{signupErrors.name.message}</p>}
              <input type="email" placeholder="이메일" className={fieldCls} {...registerSignup('email')} />
              {signupErrors.email && <p className="text-xs text-brand -mt-1 pl-2">{signupErrors.email.message}</p>}
              <input type="password" placeholder="비밀번호" className={fieldCls} {...registerSignup('password')} />
              {signupErrors.password && <p className="text-xs text-brand -mt-1 pl-2">{signupErrors.password.message}</p>}
              <input type="password" placeholder="비밀번호 확인" className={fieldCls} {...registerSignup('passwordCheck')} />
              {signupErrors.passwordCheck && <p className="text-xs text-brand -mt-1 pl-2">{signupErrors.passwordCheck.message}</p>}
              <button type="submit" disabled={isSignupDisabled} className="mt-1.5 w-full py-4 rounded-full bg-gradient-to-r from-brand to-brand-light text-white text-[16px] font-extrabold shadow-[0_14px_30px_rgba(220,20,60,0.3)] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-105 transition">
                {isSignupSubmitting ? '가입 중...' : '회원가입'}
              </button>
              <div className="flex justify-end mt-1">
                <button type="button" onClick={() => { resetSignup(); setMode('login') }} className="text-[13px] font-bold text-text-muted hover:text-brand transition-colors">로그인</button>
              </div>
            </form>
          )}
          <div className="mt-8 pt-5 border-t border-brand-soft/50 text-center">
            <p className="text-[13px] text-text-secondary leading-relaxed">
              해병대사 지휘통신참모처 지능정보화발전과 AI DATA TF
            </p>
            <p className="mt-2 text-[11px] tracking-wide text-text-muted">MARS v1.0.0</p>
          </div>
        </div>
      </div>

    </div>
  )
}

export default LoginPage
