import type { ButtonHTMLAttributes } from 'react'

// 글자가 있는 공용 버튼. 지금은 여러 화면에서 모양이 완전히 같은 세 종류만 있다.
// 그 밖의 버튼(탭·칩·목록 행·카드 등)은 화면마다 크기가 달라 아직 각자 그린다.
type Variant =
  /** 모달의 확인 버튼 (브랜드 색 바탕). disabled면 흐린 바탕 */
  | 'primary'
  /** 모달의 취소 버튼 (바탕 없음) */
  | 'ghost'
  /** 글자만 있는 링크 모양 (다시 시도 등) */
  | 'link'

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    'rounded-full px-5 py-2 text-[13.5px] font-semibold transition-colors',
  ghost:
    'rounded-full px-4 py-2 text-[13.5px] font-semibold text-text-secondary transition-colors hover:bg-rose-divider',
  link: 'text-sm text-brand hover:underline',
}

interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className' | 'style'
> {
  variant: Variant
}

export default function Button({
  variant,
  type = 'button',
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isPrimary = variant === 'primary'
  const state = !isPrimary
    ? ''
    : disabled
      ? ' bg-rose-divider text-rose-muted'
      : ' text-white hover:bg-[var(--color-brand-hover)]'
  return (
    <button
      type={type}
      disabled={disabled}
      // 바탕색은 기존 화면과 같게 인라인으로 준다 (클래스로 옮기면 hover 색이 살아나 모양이 달라진다)
      style={
        isPrimary && !disabled
          ? { background: 'var(--color-brand)' }
          : undefined
      }
      className={VARIANT_CLASS[variant] + state}
      {...props}
    >
      {children}
    </button>
  )
}
