import { useState } from 'react'
import { z } from 'zod'
import { useForm as useHookForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../context/AuthContext'
import { signup } from '../api/services/auth'
import BackgroundWave from '../ui/components/BackgroundWave'
import LoginCard from '../ui/components/LoginCard'
import SignupCard from '../ui/components/SignupCard'
import Toast from '../ui/components/Toast'
import { getApiError, isNetworkError, DEFAULT_STATUS_ERRORS } from '../utils/error'
import { logError } from '../utils/logError'

const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i

const loginSchema = z.object({
  email: z.string()
    .min(1, '이메일을 입력해주세요.')
    .refine((v) => EMAIL_REGEX.test(v), '이메일 형식이 올바르지 않습니다.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
})

const signupSchema = z.object({
  email: z.string()
    .min(1, '이메일을 입력해주세요.')
    .refine((v) => EMAIL_REGEX.test(v), '유효한 이메일 주소를 입력해주세요.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
  passwordCheck: z.string(),
  name: z.string().min(1, '이름을 입력해주세요.'),
}).refine((data) => data.password === data.passwordCheck, {
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

const LoginPage = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [toastSeq, setToastSeq] = useState(0)
  const [toastError, setToastError] = useState('')
  const [signupSuccess, setSignupSuccess] = useState(false)
  const { login } = useAuth()

  const bumpToast = (msg: string) => {
    setToastError(msg)
    setToastSeq((s) => s + 1)
  }

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    reset: resetLogin,
    watch: watchLogin,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
  } = useHookForm<LoginFields>({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  })

  const loginValues = watchLogin()
  const isLoginDisabled =
    isLoginSubmitting || Object.values(loginValues).some((v) => v === '')

  const handleLogin: SubmitHandler<LoginFields> = async (data) => {
    try {
      await login(data)
    } catch (error) {
      logError('login', error)
      if (isNetworkError(error)) {
        bumpToast('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.')
        return
      }
      bumpToast(getApiError(error, LOGIN_ERRORS, DEFAULT_STATUS_ERRORS, '로그인 중 오류가 발생했습니다.'))
    }
  }

  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    reset: resetSignup,
    watch: watchSignup,
    formState: { errors: signupErrors, isSubmitting: isSignupSubmitting },
  } = useHookForm<SignupFields>({
    defaultValues: { name: '', email: '', password: '', passwordCheck: '' },
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
  })

  const signupValues = watchSignup()
  const isSignupDisabled =
    isSignupSubmitting || Object.values(signupValues).some((v) => v === '')

  const handleSignup: SubmitHandler<SignupFields> = async (data) => {
    const { passwordCheck: _, ...rest } = data
    try {
      await signup(rest)
      setSignupSuccess(true)
      setMode('login')
    } catch (error) {
      logError('signup', error)
      if (isNetworkError(error)) {
        bumpToast('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.')
        return
      }
      bumpToast(getApiError(error, SIGNUP_ERRORS, {}, '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.'))
    }
  }

  return (
    <>
      <BackgroundWave />
      {mode === 'login' ? (
        <LoginCard
          register={registerLogin}
          errors={loginErrors}
          isLoading={isLoginSubmitting}
          isDisabled={isLoginDisabled}
          onSubmit={handleLoginSubmit(handleLogin)}
          onSignupClick={() => { resetLogin(); resetSignup(); setToastError(''); setMode('signup'); }}
        />
      ) : (
        <SignupCard
          register={registerSignup}
          errors={signupErrors}
          isSubmitting={isSignupSubmitting}
          isDisabled={isSignupDisabled}
          onSubmit={handleSignupSubmit(handleSignup)}
          onLoginClick={() => { resetSignup(); setToastError(''); setMode('login'); }}
        />
      )}
      {toastError && <Toast key={toastSeq} message={toastError} onClose={() => setToastError('')} />}
      {signupSuccess && <Toast key="signup-success" message="회원가입이 완료되었습니다." type="success" onClose={() => setSignupSuccess(false)} />}
    </>
  )
}

export default LoginPage
