import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { useForm as useHookForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../context/AuthContext'
import { signup } from '../api/services/auth'
import MarsPlanet from '../ui/components/MarsPlanet'
import Toast from '../ui/components/Toast'
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
const FeatureIcon = ({ type }: { type: 'learn' | 'source' | 'update' }) => {
  const common = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (type === 'learn') return (<svg {...common}><path d="M12 3l7 3v5c0 4.2-2.8 7.4-7 9-4.2-1.6-7-4.8-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>)
  if (type === 'source') return (<svg {...common}><path d="M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z" /><path d="M14 3v6h6M8 13h8M8 17h6" /></svg>)
  return (<svg {...common}><path d="M21 12a9 9 0 1 1-2.6-6.3M21 4v5h-5" /></svg>)
}

const FEATURES = [
  { icon: 'learn' as const, title: '해병대 특화 학습', desc: '병영생활·인사·복무 규정 등 우리 군 실무 문서로 학습해 부대 맥락을 이해합니다.' },
  { icon: 'source' as const, title: '출처 기반 답변', desc: 'RAG 검색으로 실제 규정 원문을 찾아 근거·조항과 함께 답변해 신뢰할 수 있습니다.' },
  { icon: 'update' as const, title: '최신 규정 반영', desc: '개정된 법령·지침을 문서 저장소에 반영해 언제나 최신 기준으로 안내합니다.' },
]

const LoginPage = () => {
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
      {/* ===== 인트로 (스크롤) ===== */}
      <div ref={introRef} className="mars-intro ">
        {/* Hero */}
        <section className="mars-hero mars-section relative flex items-center min-h-screen px-[6vw]">
          <div className="max-w-[600px] relative z-[1]">
            <div className="mars-reveal flex items-center gap-3 mb-6">
              <span className="w-8 h-0.5 bg-brand" />
              <span className="text-[13px] font-bold tracking-[0.22em] text-brand-hover">대한민국 해병대 · ROKMC LLM</span>
            </div>
            <h1 className="mars-reveal mars-wordmark m-0 font-black text-brand text-glow-brand">MARS</h1>
            <p className="mars-reveal mt-5 font-extrabold leading-snug text-text-primary text-[27px]">
              해병대를 위한 인공지능,<br />이제 <span className="text-brand">MARS</span>와 함께.
            </p>
            <p className="mars-reveal mt-4 text-[16px] leading-relaxed text-text-secondary max-w-[440px] break-keep">
              Marine Artificial Intelligence Retrieval System.
              <br />
              법령·규정·규칙을 참조해
              <br />
              장병의 질문에 근거와 함께 답합니다.

            </p>
            {/* 시작하기 ↔ 팀소개/사용법 : 같은 자리에 겹쳐두고 opacity 크로스페이드(뚝 끊김 방지) */}
            <div className="mars-reveal mt-10 relative h-14">
              <div className={`absolute inset-0 flex items-center transition-opacity duration-500 ${view === 'intro' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <button onClick={openAuth} className="inline-flex items-center gap-2.5 px-9 py-4 rounded-full bg-gradient-to-r from-brand to-brand-light text-white text-[17px] font-extrabold shadow-[0_16px_36px_rgba(220,20,60,0.36)] hover:brightness-105 active:scale-[0.98] transition">
                  MARS 시작하기 <span>→</span>
                </button>
              </div>
              <div className={`absolute inset-0 flex items-center gap-3 transition-opacity duration-500 ${view === 'auth' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <button type="button" onClick={() => window.open('https://channel.io/ko/team', '_blank')} className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full border border-brand-soft bg-white/70 text-[14px] font-bold text-brand-hover hover:bg-brand-subtle transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  팀 소개
                </button>
                <button type="button" onClick={() => window.open('https://channel.io/ko/team', '_blank')} className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full border border-brand-soft bg-white/70 text-[14px] font-bold text-brand-hover hover:bg-brand-subtle transition-colors">
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
        <section ref={featuresRef} className="mars-section px-[6vw] py-24 min-h-screen flex flex-col justify-center">
          <div className="max-w-[1180px] mx-auto">
            <div className="mars-reveal text-center mb-3 text-[13px] font-bold tracking-[0.22em] text-brand-hover">가장 큰 특징</div>
            <h2 className="mars-reveal text-center mx-auto max-w-[760px] font-extrabold leading-snug tracking-tight" style={{ fontSize: 'clamp(30px,4vw,50px)' }}>
              법령, 규정, 규칙을<br /><span className="text-brand">인공지능</span>이 학습합니다.
            </h2>
            <p className="mars-reveal text-center mx-auto max-w-[620px] mt-4 mb-16 text-[17px] text-text-secondary leading-relaxed">
              MARS는 해병대 실무 문서를 근거로 답하며, 모든 답변에 출처를 함께 제시합니다.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="mars-reveal p-8 rounded-2xl bg-white border border-brand-soft/60 shadow-[0_18px_40px_rgba(160,0,40,0.06)]">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand to-brand-light flex items-center justify-center mb-5 text-white">
                    <FeatureIcon type={f.icon} />
                  </div>
                  <div className="text-xl font-extrabold mb-2">{f.title}</div>
                  <div className="text-[15px] text-text-secondary leading-relaxed">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Usage (채팅 소개) — 좌우 스플릿 */}
        <section className="px-[6vw] mars-section min-h-screen flex flex-col justify-center py-20">
          <div className="max-w-[1280px] mx-auto w-full flex flex-col lg:flex-row gap-14 items-center">

            {/* 왼쪽: 텍스트 + 스텝 */}
            <div className="flex-1 min-w-0">
              <div className="mars-reveal mb-3 text-[13px] font-bold tracking-[0.22em] text-brand-hover">사용 방법</div>
              <h2 className="mars-reveal font-extrabold leading-snug tracking-tight mb-6" style={{ fontSize: 'clamp(30px,3.8vw,52px)' }}>
                물어보고 싶은<br />것을 입력하세요.
              </h2>
              <p className="mars-reveal text-[16px] text-text-secondary leading-relaxed mb-14 max-w-[380px]">
                궁금한 규정과 절차를 평소 말하듯 입력하면, MARS가 관련 조항을 찾아 근거와 함께 답합니다.
              </p>
              <div className="flex flex-col gap-8">
                {[['STEP 01', '질문 입력', '궁금한 규정·절차를 평소 말하듯 입력합니다.'], ['STEP 02', 'RAG 검색', 'MARS가 규정 문서에서 관련 조항을 찾습니다.'], ['STEP 03', '근거와 함께 답변', '출처 문서를 명시해 신뢰할 수 있게 답합니다.']].map(([s, t, d]) => (
                  <div key={s} className="mars-reveal flex gap-5 items-start">
                    <span className="shrink-0 text-[13px] font-extrabold text-brand tracking-wide pt-0.5 w-14">{s}</span>
                    <div>
                      <div className="text-[18px] font-extrabold mb-1">{t}</div>
                      <div className="text-[14px] text-text-secondary leading-relaxed">{d}</div>
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
                  <div className="flex gap-3.5">
                    <MarsPlanet className="w-8 h-8 shrink-0 mt-0.5" />
                    <div className="text-[15px] leading-relaxed text-text-primary pt-0.5">
                      <b className="font-extrabold">정기휴가</b> 신청은 다음 순서로 진행됩니다.
                      <div className="mt-3 flex flex-col gap-2.5">
                        {['부대 휴가계획에 따라 희망 기간을 선정합니다.', '휴가원을 작성해 소속 지휘관의 결재를 받습니다.', '승인 후 국방인사정보체계에 등록하면 완료됩니다.'].map((t, i) => (
                          <div key={i} className="flex gap-3 items-start"><span className="shrink-0 w-6 h-6 rounded-full bg-brand-subtle text-brand text-[13px] font-extrabold flex items-center justify-center mt-0.5">{i + 1}</span><span>{t}</span></div>
                        ))}
                      </div>
                      <div className="mt-5 pt-4 border-t border-brand-soft/50 flex flex-wrap gap-2 items-center">
                        <span className="text-xs font-bold text-text-muted">근거 문서</span>
                        {['군인복무기본법 제18조', '군인의 지위 및 복무에 관한 기본법 시행령'].map((s) => (
                          <span key={s} className="text-xs font-semibold text-brand-hover bg-brand-subtle border border-brand-soft px-3 py-1.5 rounded-full">{s}</span>
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

        {/* CTA */}
        <section className="px-[6vw] mars-section pt-60 pb-32 text-center min-h-screen">
          <h2 className="mars-reveal m-0 mb-5 font-black tracking-tight" style={{ fontSize: 'clamp(36px,5vw,60px)' }}>지금 <span className="text-brand">시작</span>해보세요</h2>
          <p className="mars-reveal mx-auto mb-9 max-w-[460px] text-[17px] text-text-secondary leading-relaxed">해병대의 모든 규정을, 대화 한 번으로.<br />MARS가 장병 여러분과 함께합니다.</p>
          <button onClick={openAuth} className="mars-reveal inline-flex items-center gap-2.5 px-10 py-4 rounded-full bg-gradient-to-r from-brand to-brand-light text-white text-[18px] font-extrabold shadow-[0_20px_44px_rgba(220,20,60,0.38)] hover:brightness-105 active:scale-[0.98] transition">
            MARS 시작하기 <span>→</span>
          </button>
          <div className="mt-9 text-[13px] text-text-muted">대한민국 해병대 · MARS · 본 답변은 참고용이며 공식 규정을 우선합니다.</div>
        </section>
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
          <div className="mt-8 pt-5 border-t border-brand-soft/50 text-center text-[12px] text-text-muted leading-relaxed">
            대한민국 해병대 · MARS<br />본 서비스는 참고용이며 공식 규정을 우선합니다.
          </div>
        </div>
      </div>

      {toastError && <Toast key={toastSeq} message={toastError} onClose={() => setToastError('')} />}
      {signupSuccess && <Toast key="signup-success" message="회원가입이 완료되었습니다." type="success" onClose={() => setSignupSuccess(false)} />}
    </div>
  )
}

export default LoginPage
