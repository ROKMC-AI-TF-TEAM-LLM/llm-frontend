import type { ButtonHTMLAttributes } from 'react'

interface ChipProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'style'
> {
  /** 지금 고른 것 */
  selected: boolean
  /** 배치용 클래스만 */
  className?: string
}

/** 여러 개 중 하나를 고르는 알약 모양 버튼 (상태 필터, 쪽 번호) */
export default function Chip({
  selected,
  className = '',
  children,
  ...props
}: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`inline-flex h-8 min-w-8 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-13 font-medium transition-colors ${
        selected
          ? 'bg-brand text-white'
          : 'border border-surface-border bg-surface text-text-secondary hover:bg-surface-subtle'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
