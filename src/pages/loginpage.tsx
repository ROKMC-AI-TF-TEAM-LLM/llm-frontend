import { useState } from 'react'
import { z } from 'zod'
import { useForm as useHookForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../context/AuthContext'
import useForm from '../hooks/useform'
import { validateSignIn, type UserSignInformation } from '../utils/validate'
import { signup } from '../api/services/auth'
import BackgroundWave from '../ui/components/backgroundwave'
import LoginCard from '../ui/components/logincard'
import SignupCard from '../ui/components/signupcard'
import Toast from '../ui/components/Toast'

const signupSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
  passwordCheck: z.string(),
  name: z.string().min(1, '이름을 입력해주세요.'),
}).refine((data) => data.password === data.passwordCheck, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['passwordCheck'],
})

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
  const [showSignupToast, setShowSignupToast] = useState(false)
  const { login } = useAuth()

  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [loginServerError, setLoginServerError] = useState('')
  const { values, errors: loginErrors, touched, getInputProps } = useForm<UserSignInformation>({
    initialValues: { email: '', password: '' },
    validate: validateSignIn,
  })

  const isLoginDisabled =
    isLoginLoading ||
    Object.values(loginErrors || {}).some((e) => e.length > 0) ||
    Object.values(values).some((v) => v === '')

  const handleLogin = async () => {
    setLoginServerError('')
    setIsLoginLoading(true)
    try {
      await login(values)
    } catch (error: any) {
      if (!error?.response) {
        setLoginServerError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.')
        return
      }
      const code = error.response.data?.error?.code
      const status = error.response.status
      const STATUS_ERRORS: Record<number, string> = {
        401: '이메일 또는 비밀번호가 올바르지 않습니다.',
        403: '접근이 거부되었습니다. 관리자에게 문의하세요.',
        404: '사용자를 찾을 수 없습니다.',
        500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      }
      setLoginServerError(LOGIN_ERRORS[code] ?? STATUS_ERRORS[status] ?? '로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoginLoading(false)
    }
  }

  const [signupServerError, setSignupServerError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors: signupErrors, isSubmitting },
  } = useHookForm<SignupFields>({
    defaultValues: { name: '', email: '', password: '', passwordCheck: '' },
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
  })

  const handleSignup: SubmitHandler<SignupFields> = async (data) => {
    const { passwordCheck: _, ...rest } = data
    try {
      await signup(rest)
      setMode('login')
      setShowSignupToast(true)
    } catch (error: any) {
      const code = error?.response?.data?.error?.code
      setSignupServerError(SIGNUP_ERRORS[code] ?? '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <>
      <BackgroundWave />
      {showSignupToast && (
        <Toast
          message="회원가입 신청이 완료되었습니다."
          type="success"
          onClose={() => setShowSignupToast(false)}
        />
      )}
      {mode === 'login' ? (
        <LoginCard
          getInputProps={getInputProps}
          errors={loginErrors}
          touched={touched}
          isLoading={isLoginLoading}
          isDisabled={isLoginDisabled}
          serverError={loginServerError}
          onSubmit={handleLogin}
          onSignupClick={() => setMode('signup')}
        />
      ) : (
        <SignupCard
          register={register}
          errors={signupErrors}
          isSubmitting={isSubmitting}
          serverError={signupServerError}
          onSubmit={handleSubmit(handleSignup)}
          onLoginClick={() => setMode('login')}
        />
      )}
    </>
  )
}

export default LoginPage
