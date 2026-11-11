import { useImperativeHandle, useState, type Ref } from 'react'
import { z } from 'zod'
import {
  useForm as useHookForm,
  useWatch,
  type SubmitHandler,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../useAuth'
import { useSignup } from '../hooks'
import { showToast } from '@/shared/store/toastStore'
import {
  ERROR_TEXT,
  getApiError,
  isNetworkError,
  DEFAULT_STATUS_ERRORS,
} from '@/shared/utils/error'
import { logError } from '@/shared/utils/logError'
import { APP_VERSION } from '@/shared/constants'

const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i

const loginSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요.')
    .refine((v) => EMAIL_REGEX.test(v), '이메일 형식이 올바르지 않습니다.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
})
const signupSchema = z
  .object({
    email: z
      .string()
      .min(1, '이메일을 입력해주세요.')
      .refine((v) => EMAIL_REGEX.test(v), '유효한 이메일 주소를 입력해주세요.'),
    password: z.string().min(1, '비밀번호를 입력해주세요.'),
    passwordCheck: z.string(),
    name: z.string().min(1, '이름을 입력해주세요.'),
  })
  .refine((data) => data.password === data.passwordCheck, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['passwordCheck'],
  })

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
const SIGNUP_ERRORS: Record<string, string> = {
  EMAIL_ALREADY_EXISTS: '이미 사용 중인 이메일입니다.',
}

export interface AuthPanelHandle {
  /** 빈 로그인 폼으로 되돌린다 */
  reset: () => void
}

/** 오른쪽에서 밀려 나오는 로그인·회원가입 창. 밀려 나오는 모양은 global.css의 .mars-auth-panel이 맡는다 */
export function AuthPanel({
  onClose,
  ref,
}: {
  onClose: () => void
  ref: Ref<AuthPanelHandle>
}) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const { login } = useAuth()

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    reset: resetLogin,
    control: loginControl,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
  } = useHookForm<LoginFields>({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  })
  const loginValues = useWatch({ control: loginControl })
  const isLoginDisabled =
    isLoginSubmitting || Object.values(loginValues).some((v) => v === '')

  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    reset: resetSignup,
    control: signupControl,
    formState: { errors: signupErrors, isSubmitting: isSignupSubmitting },
  } = useHookForm<SignupFields>({
    defaultValues: { name: '', email: '', password: '', passwordCheck: '' },
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
  })
  const signupValues = useWatch({ control: signupControl })
  const isSignupDisabled =
    isSignupSubmitting || Object.values(signupValues).some((v) => v === '')

  const handleLogin: SubmitHandler<LoginFields> = async (data) => {
    try {
      await login(data)
    } catch (error) {
      logError('login', error)
      if (isNetworkError(error)) {
        showToast(ERROR_TEXT.network)
        return
      }
      showToast(
        getApiError(
          error,
          LOGIN_ERRORS,
          DEFAULT_STATUS_ERRORS,
          '로그인 중 오류가 발생했습니다.',
        ),
      )
    }
  }
  const signupMutation = useSignup()
  const handleSignup: SubmitHandler<SignupFields> = async (data) => {
    const { passwordCheck: _pw, ...rest } = data
    void _pw
    try {
      await signupMutation.mutateAsync(rest)
      showToast('회원가입이 완료되었습니다.', 'success')
      setMode('login')
    } catch (error) {
      if (isNetworkError(error)) {
        showToast(ERROR_TEXT.network)
        return
      }
      showToast(
        getApiError(
          error,
          SIGNUP_ERRORS,
          {},
          '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.',
        ),
      )
    }
  }

  // 로그인 창을 열 때마다 빈 로그인 폼에서 시작한다
  useImperativeHandle(ref, () => ({
    reset() {
      resetLogin()
      resetSignup()
      setMode('login')
    },
  }))

  const fieldCls =
    'w-full px-5 py-3.5 rounded-full border border-surface-border bg-white text-sm text-text-primary outline-none focus:border-brand transition-colors'

  return (
    <div className="mars-auth-panel">
      <button
        onClick={onClose}
        aria-label="소개로 돌아가기"
        className="absolute top-6 right-7 w-11 h-11 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      <div className="mars-panel-inner">
        <div className="text-[28px] font-extrabold text-text-primary mars-brand-serif leading-tight">
          {mode === 'login' ? '로그인' : '회원가입'}
        </div>
        <p className="mt-2 text-[14px] text-text-secondary">
          {mode === 'login'
            ? '계정으로 로그인하고 MARS를 시작하세요.'
            : '관리자 승인 후 서비스 이용이 가능합니다.'}
        </p>

        {mode === 'login' ? (
          <form
            onSubmit={handleLoginSubmit(handleLogin)}
            className="mt-7 flex flex-col gap-3"
          >
            <input
              type="email"
              placeholder="이메일"
              className={fieldCls}
              {...registerLogin('email')}
            />
            {loginErrors.email && (
              <p className="text-xs text-brand -mt-1 pl-2">
                {loginErrors.email.message}
              </p>
            )}
            <input
              type="password"
              placeholder="비밀번호"
              className={fieldCls}
              {...registerLogin('password')}
            />
            {loginErrors.password && (
              <p className="text-xs text-brand -mt-1 pl-2">
                {loginErrors.password.message}
              </p>
            )}
            <button
              type="submit"
              disabled={isLoginDisabled}
              className="mt-1.5 w-full py-4 rounded-full mars-brand-serif bg-gradient-to-r from-brand to-brand-light text-white text-[16px] font-extrabold shadow-[0_14px_30px_rgba(220,20,60,0.3)] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-105 transition"
            >
              {isLoginSubmitting ? '로그인 중...' : '시작하기'}
            </button>
            <div className="flex justify-end mt-1">
              <button
                type="button"
                onClick={() => {
                  resetLogin()
                  resetSignup()
                  setMode('signup')
                }}
                className="text-[13px] font-bold text-text-muted hover:text-brand transition-colors"
              >
                회원가입
              </button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={handleSignupSubmit(handleSignup)}
            className="mt-7 flex flex-col gap-3"
          >
            <input
              type="text"
              placeholder="이름"
              className={fieldCls}
              {...registerSignup('name')}
            />
            {signupErrors.name && (
              <p className="text-xs text-brand -mt-1 pl-2">
                {signupErrors.name.message}
              </p>
            )}
            <input
              type="email"
              placeholder="이메일"
              className={fieldCls}
              {...registerSignup('email')}
            />
            {signupErrors.email && (
              <p className="text-xs text-brand -mt-1 pl-2">
                {signupErrors.email.message}
              </p>
            )}
            <input
              type="password"
              placeholder="비밀번호"
              className={fieldCls}
              {...registerSignup('password')}
            />
            {signupErrors.password && (
              <p className="text-xs text-brand -mt-1 pl-2">
                {signupErrors.password.message}
              </p>
            )}
            <input
              type="password"
              placeholder="비밀번호 확인"
              className={fieldCls}
              {...registerSignup('passwordCheck')}
            />
            {signupErrors.passwordCheck && (
              <p className="text-xs text-brand -mt-1 pl-2">
                {signupErrors.passwordCheck.message}
              </p>
            )}
            <button
              type="submit"
              disabled={isSignupDisabled}
              className="mt-1.5 w-full py-4 rounded-full bg-gradient-to-r from-brand to-brand-light text-white text-[16px] font-extrabold shadow-[0_14px_30px_rgba(220,20,60,0.3)] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-105 transition"
            >
              {isSignupSubmitting ? '가입 중...' : '회원가입'}
            </button>
            <div className="flex justify-end mt-1">
              <button
                type="button"
                onClick={() => {
                  resetSignup()
                  setMode('login')
                }}
                className="text-[13px] font-bold text-text-muted hover:text-brand transition-colors"
              >
                로그인
              </button>
            </div>
          </form>
        )}
        <div className="mt-8 pt-5 border-t border-brand-soft/50 text-center">
          <p className="text-[13px] text-text-secondary mars-brand-serif leading-relaxed">
            해병대사 지휘통신참모처 지능정보화발전과 AI DATA TF
          </p>
          <p className="mt-2 text-[11px] tracking-wide mars-brand-serif text-text-muted">
            MARS v{APP_VERSION}
          </p>
        </div>
      </div>
    </div>
  )
}
