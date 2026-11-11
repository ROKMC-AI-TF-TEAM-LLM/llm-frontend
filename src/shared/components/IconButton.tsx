import type { ReactNode } from 'react'

interface IconButtonProps {
  /** 버튼이 하는 일. 아이콘만 있으므로 aria-label과 툴팁으로 쓴다 */
  label: string
  onClick?: () => void
  /** 켜진 상태 (예: 즐겨찾기) */
  active?: boolean
  /** 삭제처럼 되돌릴 수 없는 동작 */
  danger?: boolean
  disabled?: boolean
  children: ReactNode
}

/** 아이콘만 있는 32px 정사각 버튼. 누름은 부모로 전파하지 않는다(행 안에 놓여도 행이 눌리지 않게) */
export default function IconButton({ label, onClick, active = false, danger = false, disabled = false, children }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] transition-colors ${
        active
          ? 'text-brand hover:bg-brand-subtle'
          : danger
            ? 'text-text-muted hover:bg-red-50 hover:text-red-500'
            : 'text-text-muted hover:bg-[#f7f2f3] hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  )
}
