import type { ButtonHTMLAttributes } from 'react'

// 글자가 있는 공용 버튼. 앱의 모든 동작 버튼은 여기 있는 종류·크기 중 하나를 쓴다.
// 모양을 바꾸려면 이 파일의 표만 고치면 된다. (아이콘만 있는 버튼은 IconButton)

const VARIANT = {
  /** 화면의 주된 동작 (저장·업로드·다운로드) */
  primary: 'bg-brand text-white hover:bg-brand-hover',
  /** 보조 동작 (재시도·다운로드 등 브랜드 색 테두리) */
  secondary: 'border border-brand-soft text-brand hover:bg-brand-subtle',
  /** 눈에 덜 띄는 동작 (취소·중지 등 회색 테두리) */
  outline:
    'border border-surface-border text-text-secondary hover:bg-surface-subtle',
  /** 삭제. 평소엔 outline과 같고 올리면 붉어진다 */
  danger:
    'border border-surface-border text-text-secondary hover:border-red-200 hover:bg-red-50 hover:text-red-500',
  /** 테두리 없는 동작 (모달의 취소) */
  ghost: 'text-text-secondary hover:bg-surface-subtle',
  /** 글자만 있는 링크 모양 (다시 시도·전체 보기). 크기(size)의 높이·여백은 적용되지 않는다 */
  link: 'text-brand hover:underline',
}

const SIZE = {
  sm: 'h-8 px-3 text-12',
  md: 'h-9 px-4 text-13',
  lg: 'h-10 px-5 text-14',
}
const LINK_SIZE = { sm: 'text-12', md: 'text-13', lg: 'text-14' }

interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'style'
> {
  variant: keyof typeof VARIANT
  size?: keyof typeof SIZE
  /** 부모 너비를 다 채운다 */
  fullWidth?: boolean
  /** 배치용 클래스만 (여백·위치). 색·크기는 variant·size로 정한다 */
  className?: string
}

export default function Button({
  variant,
  size = 'md',
  fullWidth = false,
  type = 'button',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const shape =
    variant === 'link'
      ? `inline-flex items-center gap-1 font-semibold ${LINK_SIZE[size]}`
      : `inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-semibold ${SIZE[size]}`
  return (
    <button
      type={type}
      className={`${shape} transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
