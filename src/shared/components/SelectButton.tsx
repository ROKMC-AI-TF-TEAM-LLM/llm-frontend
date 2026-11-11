import type { ButtonHTMLAttributes } from 'react'
import { ChevronDownIcon } from './icons'

interface SelectButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'style'
> {
  /** 메뉴가 펼쳐져 있는지 */
  open: boolean
  /** 값이 골라져 있는지 (글자가 진해진다) */
  active?: boolean
  /** 배치용 클래스만 */
  className?: string
}

/** 눌러서 메뉴를 펼치고 값을 고르는 알약 모양 버튼 (분야·파일 유형·양식). 메뉴는 쓰는 쪽에서 그린다 */
export default function SelectButton({
  open,
  active = false,
  className = '',
  children,
  ...props
}: SelectButtonProps) {
  const look = open
    ? 'bg-brand-subtle text-brand'
    : active
      ? 'text-text-primary'
      : 'text-text-muted'
  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-13 font-medium transition-colors hover:bg-brand-subtle hover:text-brand disabled:pointer-events-none disabled:opacity-60 ${look} ${className}`}
      {...props}
    >
      {children}
      <ChevronDownIcon
        className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
      />
    </button>
  )
}
