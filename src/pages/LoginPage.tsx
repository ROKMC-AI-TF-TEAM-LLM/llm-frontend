import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm as useHookForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../context/AuthContext'
import { signup } from '../api/services/auth'
import MarsPlanet from '../ui/components/MarsPlanet'
import Toast from '../ui/components/Toast'
import TerminalDemo from '../ui/components/landing/TerminalDemo'
import Reveal from '../ui/components/landing/Reveal'
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

// 통일된 라인 아이콘 (기능 카드용)
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

// 히어로 문구 끝에서 계속 바뀌는 동사. 마침표는 밑줄 밖에 따로 찍는다
// (마침표까지 밑줄이 그어지면 지저분해 보인다).
const HERO_VERBS = ['물어보세요', '찾아보세요', '확인하세요', '정리하세요']

// 히어로 하단 기능 카드 — Grok의 제품 메뉴처럼 서비스의 축을 한눈에 보여준다.
const FEATURES: { icon: IconType; title: string; desc: string }[] = [
  { icon: 'learn', title: '해병대 특화 학습', desc: '병영생활·인사·복무 규정 등 우리 군 실무 문서로 학습해 부대 맥락을 이해합니다.' },
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
  const [toastSeq, setToastSeq] = useState(0)
  const [toastError, setToastError] = useState('')
  const [signupSuccess, setSignupSuccess] = useState(false)
  const { login } = useAuth()

  const introRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)

  const bumpToast = (msg: string) => { setToastError(msg); setToastSeq((s) => s + 1) }

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
      if (isNetworkError(error)) { bumpToast('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'); return }
      bumpToast(getApiError(error, LOGIN_ERRORS, DEFAULT_STATUS_ERRORS, '로그인 중 오류가 발생했습니다.'))
    }
  }
  const handleSignup: SubmitHandler<SignupFields> = async (data) => {
    const { passwordCheck: _pw, ...rest } = data
    void _pw
    try { await signup(rest); setSignupSuccess(true); setMode('login') }
    catch (error) {
      logError('signup', error)
      if (isNetworkError(error)) { bumpToast('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'); return }
      bumpToast(getApiError(error, SIGNUP_ERRORS, {}, '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.'))
    }
  }

  const openAuth = () => {
    const el = introRef.current
    // 이미 상단이면 바로 열고, 아래로 스크롤된 상태면 부드럽게 top까지 올린 뒤 연다(뚝 끊김 방지)
    if (!el || el.scrollTop <= 4) { setView('auth'); return }
    let done = false
    const finish = () => {
      if (done) return
      done = true
      clearTimeout(t)
      el.removeEventListener('scrollend', finish)
      setView('auth')
    }
    const t = window.setTimeout(finish, 1000) // scrollend 미지원 브라우저 폴백
    el.addEventListener('scrollend', finish)
    el.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const closeAuth = () => { setView('intro'); requestAnimationFrame(() => introRef.current?.scrollTo({ top: 0, behavior: 'smooth' })) }
  const scrollToFeatures = () => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })

  // 로그인 패널은 항상 마운트된 채 transform으로만 밀려나므로(.mars-auth-panel), 닫아도 입력값이 남는다.
  // → 패널이 '열릴 때' 폼/에러/모드를 비운다. (닫힐 때 비우면 슬라이드 아웃 도중 글자가 사라지는 게 보이고,
  //    타이머로 미루면 그 사이에 다시 열었을 때 입력이 남는 경합이 생긴다)
  // useLayoutEffect: 패널이 그려지기 '전'에 비워야 이전 입력이 한 프레임도 보이지 않는다.
  useLayoutEffect(() => {
    if (view !== 'auth') return
    resetLogin()
    resetSignup()
    setMode('login')
    setToastError('')
    setSignupSuccess(false)
  }, [view, resetLogin, resetSignup])

  // 인트로 등장 애니메이션
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

      {/* ===== 인트로 (스크롤) ===== */}
      <div ref={introRef} className="mars-intro ">
        {/* Hero */}
        <section className="mars-hero mars-section relative flex items-center min-h-screen px-[6vw] pt-20">
          <div className="mars-grid-bg" />
          <div className="mars-glow-bg" style={{ width: 620, height: 620, right: '-6%', top: '2%' }} />
          <div className="max-w-[640px] relative z-[1]">
            {/* 원문 그대로 노출 — 풀네임이라 대문자 변환/넓은 자간은 끈다.
                자간을 좁혀 워드마크 폭과 어울리게 하고, 크기는 조금 키워 붕 뜨지 않게 한다. */}
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
            {/* 시작하기 ↔ 팀소개/사용법 : 같은 자리에 겹쳐두고 opacity 크로스페이드(뚝 끊김 방지) */}
            <div className="mars-reveal mt-8 relative h-[52px]">
              <div className={`absolute inset-0 flex items-center gap-3 transition-opacity duration-500 ${view === 'intro' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {/* 히어로에는 시작하기만 둔다 — '서비스 이용법'은 상단 탭에 이미 있다. */}
                <button onClick={openAuth} className="mars-pill mars-pill-brand">
                  MARS 시작하기 <span aria-hidden>→</span>
                </button>
              </div>
              <div className={`absolute inset-0 flex items-center gap-3 transition-opacity duration-500 ${view === 'auth' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <button type="button" onClick={() => window.open('https://channel.io/ko/team', '_blank')} className="mars-pill mars-pill-ghost text-[14px]">
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

          {/* 히어로 행성 : 히어로 안 → 스크롤과 함께 이동. 로그인 시 왼쪽으로 이동 */}
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

          {/* 더 알아보기 (중앙 하단) */}
          {view === 'intro' && (
          <button onClick={scrollToFeatures} className="absolute left-1/2 -translate-x-1/2 bottom-8 flex flex-col items-center gap-1.5 text-text-muted hover:text-brand transition-colors">
            <span className="text-[13px] font-semibold tracking-wide">더 알아보기</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'marsBob 1.7s ease-in-out infinite' }}><path d="M6 9l6 6 6-6" /></svg>
          </button>
          )}
        </section>

        <div className="mars-below">
        {/* Features */}
        <section ref={featuresRef} className="mars-section px-[6vw] py-20 min-h-screen flex flex-col justify-center">
          <div className="max-w-[1180px] mx-auto w-full">
            <div className="mars-reveal mars-eyebrow mb-4">가장 큰 특징</div>
            <h2 className="mars-reveal mars-display max-w-[820px]" style={{ fontSize: 'clamp(27px,3.2vw,42px)' }}>
              법령, 규정, 규칙을<br /><span className="text-brand">인공지능</span>이 학습합니다.
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

        {/* 터미널 데모 — MARS가 근거를 찾아내는 과정 */}
        <section className="mars-section px-[6vw] py-28 min-h-screen flex flex-col justify-center">
          <div className="max-w-[1180px] mx-auto w-full flex flex-col lg:flex-row gap-16 items-center">
            <div className="flex-1 min-w-0">
              <Reveal className="mars-eyebrow mb-5">동작 방식</Reveal>
              <Reveal delay={60}>
                <h2 className="mars-display mb-6" style={{ fontSize: 'clamp(30px,3.6vw,48px)' }}>
                  추측하지 않고,<br /><span className="text-brand">찾아서</span> 답합니다.
                </h2>
              </Reveal>
              <Reveal delay={120}>
                <p className="text-[17px] text-text-secondary leading-relaxed max-w-[420px] break-keep">
                  질문이 들어오면 MARS는 규정 문서를 직접 검색하고, 원문 조항을 열어 대조한 뒤 근거와 함께 답을 만듭니다. 그 과정을 숨기지 않고 그대로 보여줍니다.
                </p>
              </Reveal>
              <div className="mt-10 flex flex-col gap-5">
                {[
                  ['문서 검색', '질문에서 핵심어를 뽑아 관련 규정을 찾습니다.'],
                  ['원문 대조', '찾은 문서의 실제 조항을 열어 내용을 확인합니다.'],
                  ['근거 제시', '어떤 문서 몇 조를 참고했는지 함께 답합니다.'],
                ].map(([t, d], i) => (
                  <Reveal key={t} delay={180 + i * 80} className="flex gap-4 items-start">
                    <span className="shrink-0 mt-1 w-6 h-6 rounded-full bg-brand-subtle border border-brand-soft text-brand text-[12px] font-extrabold flex items-center justify-center">{i + 1}</span>
                    <div>
                      <div className="text-[16px] font-bold mb-0.5">{t}</div>
                      <div className="text-[14px] text-text-secondary leading-relaxed break-keep">{d}</div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
            <Reveal delay={100} className="flex-1 min-w-0 w-full">
              <TerminalDemo />
            </Reveal>
          </div>
        </section>

        {/* Usage (채팅 소개) — 좌우 스플릿 */}
        <section className="px-[6vw] mars-section min-h-screen flex flex-col justify-center py-20">
          <div className="max-w-[1280px] mx-auto w-full flex flex-col lg:flex-row gap-14 items-center">

            {/* 왼쪽: 텍스트 + 스텝 */}
            <div className="flex-1 min-w-0">
              <div className="mars-reveal mars-eyebrow mb-5">사용 방법</div>
              <h2 className="mars-reveal mars-display mb-6" style={{ fontSize: 'clamp(30px,3.6vw,48px)' }}>
                물어보고 싶은<br />것을 입력하세요.
              </h2>
              <p className="mars-reveal text-[17px] text-text-secondary leading-relaxed mb-12 max-w-[400px] break-keep">
                궁금한 규정과 절차를 평소 말하듯 입력하면, MARS가 관련 조항을 찾아 근거와 함께 답합니다.
              </p>
              <div className="flex flex-col gap-7">
                {[['STEP 01', '질문 입력', '궁금한 규정·절차를 평소 말하듯 입력합니다.'], ['STEP 02', 'RAG 검색', 'MARS가 규정 문서에서 관련 조항을 찾습니다.'], ['STEP 03', '근거와 함께 답변', '출처 문서를 명시해 신뢰할 수 있게 답합니다.']].map(([s, t, d]) => (
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

            {/* 오른쪽: 채팅 카드 */}
            <div className="flex-1 min-w-0 w-full">
              <div className="mars-reveal rounded-3xl bg-white border border-brand-soft/60 shadow-[0_30px_70px_rgba(150,0,40,0.10)] overflow-hidden">
                <div className="p-7 pb-4 flex flex-col gap-5">
                  <div className="self-end max-w-[72%] px-5 py-3 rounded-[20px_20px_6px_20px] bg-gradient-to-br from-brand to-brand-light text-white text-[15px] leading-relaxed shadow-[0_10px_22px_rgba(220,20,60,0.2)]">정기휴가 신청 절차를 단계별로 알려줘</div>
                  {/* 답변 — 아바타 없이 본문만. 아바타를 빼니 실제 답변 화면과 더 가깝다. */}
                  <div className="text-[15px] leading-relaxed text-text-primary">
                    <b className="font-extrabold">정기휴가</b> 신청은 다음 순서로 진행됩니다.
                    <div className="mt-3.5 flex flex-col gap-2.5">
                      {['부대 휴가계획에 따라 희망 기간을 선정합니다.', '휴가원을 작성해 소속 지휘관의 결재를 받습니다.', '승인 후 국방인사정보체계에 등록하면 완료됩니다.'].map((t, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <span className="shrink-0 w-5 h-5 mt-0.5 rounded-md bg-brand-subtle text-brand text-[11.5px] font-extrabold flex items-center justify-center">{i + 1}</span>
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>

                    {/* 근거 문서 — 실제 SourceBadge처럼 문서 아이콘 + 조항이 붙은 카드 형태 */}
                    <div className="mt-5 pt-4 border-t border-surface-border">
                      <div className="text-[11.5px] font-bold tracking-wide text-text-muted mb-2.5">근거 문서</div>
                      <div className="flex flex-col gap-2">
                        {[['군인복무기본법 제18조', '페이지 42'], ['군인의 지위 및 복무에 관한 기본법 시행령', '페이지 8']].map(([title, page]) => (
                          <div key={title} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-surface-border bg-surface-subtle">
                            <span className="shrink-0 w-7 h-7 rounded-lg bg-brand flex items-center justify-center text-white">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <path d="M14 2v6h6" />
                              </svg>
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[12.5px] font-semibold text-text-primary truncate">{title}</span>
                              <span className="block text-[11px] text-text-muted mt-0.5">{page}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-6">
                  <div style={{ border: '1px solid #f0e3e6', boxShadow: '0 12px 30px rgba(160,0,40,0.05)' }} className="flex items-center gap-3 px-4 py-3 rounded-[30px] bg-white cursor-default select-none">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b09aa0" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 11l-8.5 8.5a4 4 0 0 1-5.7-5.7l8.5-8.5a2.5 2.5 0 0 1 3.5 3.5L10 17" /></svg>
                    <span className="flex-1 text-[15px] text-text-muted">메시지를 입력하세요...</span>
                    <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-brand to-brand-light flex items-center justify-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M6 11l6-6 6 6" /></svg></div>
                  </div>
                </div>
                <div className="text-center pb-5 text-[13px] text-text-muted">MARS는 AI이므로 실수를 할 수 있습니다. 중요한 정보는 재차 확인하십시오.</div>
              </div>
            </div>

          </div>
        </section>

        {/* CTA — 버튼은 상단 네비/히어로에 이미 있으므로 문구만 둔다 */}
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

      {/* ===== 오른쪽 40% 로그인 패널 (옆에서 슬라이드 인) ===== */}
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
                <button type="button" onClick={() => { resetLogin(); resetSignup(); setToastError(''); setMode('signup') }} className="text-[13px] font-bold text-text-muted hover:text-brand transition-colors">회원가입</button>
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
                <button type="button" onClick={() => { resetSignup(); setToastError(''); setMode('login') }} className="text-[13px] font-bold text-text-muted hover:text-brand transition-colors">로그인</button>
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

      {toastError && <Toast key={toastSeq} message={toastError} onClose={() => setToastError('')} />}
      {signupSuccess && <Toast key="signup-success" message="회원가입이 완료되었습니다." type="success" onClose={() => setSignupSuccess(false)} />}
    </div>
  )
}

export default LoginPage
