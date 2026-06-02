import type { UserSignInformation } from '../../utils/validate'

interface LoginCardProps {
  getInputProps: (name: keyof UserSignInformation) => {
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onBlur: () => void
  }
  errors: Record<keyof UserSignInformation, string>
  touched: Record<keyof UserSignInformation, boolean>
  isLoading: boolean
  isDisabled: boolean
  onSubmit: () => void
  onSignupClick: () => void
}

const LoginCard = ({
  getInputProps,
  errors,
  touched,
  isLoading,
  isDisabled,
  onSubmit,
  onSignupClick,
}: LoginCardProps) => {
  return (
    <div className="card flex w-180 max-w-[92vw] min-h-88 overflow-hidden">

      <div className="flex w-1/2 flex-col items-center justify-center gap-4 border-r border-surface-border px-12 py-12">
        <div className="w-16 h-16 rounded-full border-2 border-surface-border" />
        <div className="text-center leading-none">
          <p className="text-5xl font-black tracking-tight text-brand text-glow-brand">
            ROKMC <br /> LLM
          </p>
        </div>
        <p className="text-sm text-text-secondary text-center leading-relaxed">
          대한민국 해병대<br />AI 개인비서 플랫폼
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 px-10 py-12 w-1/2">
        <h2 className="text-lg font-bold text-text-primary mb-1">로그인</h2>

        <input
          {...getInputProps('email')}
          type="email"
          placeholder="이메일"
          spellCheck={false}
          className={`w-full rounded-full border px-3 py-2 text-sm outline-none transition placeholder:text-text-muted focus:ring-2 focus:ring-brand ${
            errors?.email && touched?.email ? 'border-brand bg-brand-subtle' : 'border-surface-border'
          }`}
        />
        {errors?.email && touched?.email && (
          <p className="text-xs text-brand w-full px-3">{errors.email}</p>
        )}

        <input
          {...getInputProps('password')}
          type="password"
          placeholder="비밀번호"
          className={`w-full rounded-full border px-3 py-2 text-sm outline-none transition placeholder:text-text-muted focus:ring-2 focus:ring-brand ${
            errors?.password && touched?.password ? 'border-brand bg-brand-subtle' : 'border-surface-border'
          }`}
        />
        {errors?.password && touched?.password && (
          <p className="text-xs text-brand w-full px-3">{errors.password}</p>
        )}

        <button
          type="button"
          onClick={onSubmit}
          disabled={isDisabled}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '로그인 중...' : '시작하기'}
        </button>

        <button
          type="button"
          onClick={onSignupClick}
          className="text-xs text-text-muted hover:text-text-secondary transition cursor-pointer"
        >
          회원가입
        </button>
      </div>
    </div>
  )
}

export default LoginCard
