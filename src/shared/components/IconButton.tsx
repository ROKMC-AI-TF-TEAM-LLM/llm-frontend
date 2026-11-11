import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react'

// 아이콘만 있는 공용 버튼. 앱의 모든 아이콘 버튼은 여기 있는 크기·색조 중 하나를 쓴다.

const SIZE = {
  /** 목록 행 안의 작은 동작 (즐겨찾기·이름 변경·삭제), 검색어 지우기 */
  xs: 'h-6 w-6 rounded-md',
  sm: 'h-7 w-7 rounded-lg',
  /** 기본 */
  md: 'h-8 w-8 rounded-lg',
  /** 입력창 옆의 큰 원형 버튼 */
  lg: 'h-10 w-10 rounded-full',
}

const TONE = {
  default: 'text-text-muted hover:bg-surface-subtle hover:text-text-primary',
  brand: 'text-text-muted hover:bg-brand-subtle hover:text-brand',
  danger: 'text-text-muted hover:bg-red-50 hover:text-red-500',
  success: 'text-text-muted hover:bg-green-50 hover:text-green-600',
  /** 브랜드 색으로 채운 버튼 (전송·중지) */
  solid:
    'bg-gradient-to-br from-brand to-brand-light text-white shadow-[0_5px_13px_rgba(220,20,60,0.28)] hover:brightness-105 active:scale-95',
}

interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'style' | 'onClick' | 'aria-label' | 'title'
> {
  /** 버튼이 하는 일. 아이콘만 있으므로 aria-label과 툴팁으로 쓴다 */
  label: string
  size?: keyof typeof SIZE
  tone?: keyof typeof TONE
  /** 켜진 상태 (예: 즐겨찾기 됨). 아이콘이 브랜드 색이 된다 */
  active?: boolean
  /** 삭제처럼 되돌릴 수 없는 동작. tone="danger"와 같다 */
  danger?: boolean
  /** false면 브라우저 툴팁(title)을 달지 않는다 (직접 만든 툴팁이 있을 때) */
  tooltip?: boolean
  /** 누름은 부모로 전파하지 않는다 (행 안에 놓여도 행이 눌리지 않게) */
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  /** 배치용 클래스만 (여백·위치) */
  className?: string
  children: ReactNode
}

export default function IconButton({
  label,
  size = 'md',
  tone,
  active = false,
  danger = false,
  tooltip = true,
  disabled = false,
  onClick,
  className = '',
  children,
  ...props
}: IconButtonProps) {
  const look = active
    ? 'text-brand hover:bg-brand-subtle'
    : TONE[tone ?? (danger ? 'danger' : 'default')]
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(e)
      }}
      disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
      aria-label={label}
      title={tooltip ? label : undefined}
      className={`inline-flex shrink-0 items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${SIZE[size]} ${look} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
