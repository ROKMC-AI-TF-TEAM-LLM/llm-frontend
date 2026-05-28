import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { BaseSyntheticEvent } from 'react'

interface SignupFormFields {
  email: string
  password: string
  passwordCheck: string
  name: string
}

interface SignupCardProps {
  register: UseFormRegister<SignupFormFields>
  errors: FieldErrors<SignupFormFields>
  isSubmitting: boolean
  serverError: string
  onSubmit: (e?: BaseSyntheticEvent) => Promise<void>
  onLoginClick: () => void
}

const SignupCard = ({
  register,
  errors,
  isSubmitting,
  serverError,
  onSubmit,
  onLoginClick,
}: SignupCardProps) => {
  return (
    <div className="card flex w-180 max-w-[92vw] overflow-hidden">

      <div className="flex w-1/2 flex-col items-center justify-center gap-4 border-r border-surface-border px-12 py-12">
        {/* TODO: 로고 교체 */}
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

      <form
        onSubmit={onSubmit}
        className="flex flex-col items-center justify-center gap-2 px-10 py-10 w-1/2"
      >
        <h2 className="text-lg font-bold text-text-primary mb-1">회원가입</h2>

        <input
          {...register('name')}
          type="text"
          placeholder="이름"
          className={`w-full rounded-full border px-3 py-2 text-sm outline-none transition placeholder:text-text-muted focus:ring-2 focus:ring-brand/20 ${
            errors?.name ? 'border-brand bg-brand-subtle' : 'border-surface-border'
          }`}
        />
        {errors?.name && (
          <p className="text-xs text-brand w-full px-3">{errors.name.message}</p>
        )}

        <input
          {...register('email')}
          type="email"
          placeholder="이메일"
          spellCheck={false}
          className={`w-full rounded-full border px-3 py-2 text-sm outline-none transition placeholder:text-text-muted focus:ring-2 focus:ring-brand/20 ${
            errors?.email ? 'border-brand bg-brand-subtle' : 'border-surface-border'
          }`}
        />
        {errors?.email && (
          <p className="text-xs text-brand w-full px-3">{errors.email.message}</p>
        )}

        <input
          {...register('password')}
          type="password"
          placeholder="비밀번호"
          className={`w-full rounded-full border px-3 py-2 text-sm outline-none transition placeholder:text-text-muted focus:ring-2 focus:ring-brand/20 ${
            errors?.password ? 'border-brand bg-brand-subtle' : 'border-surface-border'
          }`}
        />
        {errors?.password && (
          <p className="text-xs text-brand w-full px-3">{errors.password.message}</p>
        )}

        <input
          {...register('passwordCheck')}
          type="password"
          placeholder="비밀번호 확인"
          className={`w-full rounded-full border px-3 py-2 text-sm outline-none transition placeholder:text-text-muted focus:ring-2 focus:ring-brand/20 ${
            errors?.passwordCheck ? 'border-brand bg-brand-subtle' : 'border-surface-border'
          }`}
        />
        {errors?.passwordCheck && (
          <p className="text-xs text-brand w-full px-3">{errors.passwordCheck.message}</p>
        )}

        {serverError && (
          <p className="text-xs text-brand text-center w-full">{serverError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '처리 중...' : '가입하기'}
        </button>

        <button
          type="button"
          onClick={onLoginClick}
          className="text-xs text-text-muted hover:text-text-secondary transition cursor-pointer"
        >
          로그인으로 돌아가기
        </button>
      </form>
    </div>
  )
}

export default SignupCard
