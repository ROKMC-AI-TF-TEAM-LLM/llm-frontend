import type { ButtonHTMLAttributes } from 'react'

interface MenuItemProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'style'
> {
  /** 지금 고른 항목 (고르는 메뉴에서) */
  selected?: boolean
  /** 이 항목의 하위 메뉴가 열려 있는 상태 */
  active?: boolean
  /** 삭제·로그아웃처럼 조심할 동작. 올리면 붉어진다 */
  danger?: boolean
  /** 배치용 클래스만 */
  className?: string
}

/** 펼침 메뉴(더보기·분야 고르기·프로필 메뉴) 안의 한 줄 */
export default function MenuItem({
  selected = false,
  danger = false,
  active = false,
  className = '',
  children,
  ...props
}: MenuItemProps) {
  const look = selected
    ? 'bg-brand-subtle font-semibold text-brand'
    : active
      ? 'bg-surface-subtle text-text-primary'
      : danger
        ? 'text-text-secondary hover:bg-red-50 hover:text-red-500'
        : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-13 transition-colors ${look} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
