// 프로젝트 화면 기본 부품: 마크·블록·아이콘 버튼·즐겨찾기 별·더보기 메뉴·경로
import { useEffect, useRef, useState } from 'react'
import { displaySessionTitle } from '../../utils/sessionTitle'
import {
  EditIcon,
  LayersIcon,
  MoreIcon,
  StarIcon,
  TrashIcon,
} from './icons'

export function Mark({ size = 34, active = false }: { size?: number; active?: boolean }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.29),
        background: active ? 'var(--color-brand)' : 'var(--color-brand-subtle)',
        color: active ? '#fff' : 'var(--color-brand)',
        border: active ? 'none' : '1px solid #f7dfe4',
      }}
      className="inline-flex shrink-0 items-center justify-center"
    >
      <LayersIcon className="h-[45%] w-[45%]" />
    </span>
  )
}

export function Block({
  icon,
  title,
  action,
  children,
}: {
  icon?: React.ReactNode
  title: string
  action?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-[14px] border border-[#f0e6e8] bg-white">
      <header className="flex items-center gap-2 border-b border-[#f4eced] px-4 py-3">
        {icon && <span className="shrink-0 text-brand">{icon}</span>}
        <h2 className="flex-1 truncate text-[13.5px] font-bold tracking-[-0.01em] text-text-primary">
          {title}
        </h2>
        {action}
      </header>
      {children && <div className="px-4 py-3.5">{children}</div>}
    </section>
  )
}

export function IconButton({
  label,
  onClick,
  active = false,
  children,
  danger = false,
  disabled = false,
}: {
  label: string
  onClick?: () => void
  active?: boolean
  children: React.ReactNode
  danger?: boolean
  disabled?: boolean
}) {
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

export function FavStar({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <IconButton label={active ? '즐겨찾기 해제' : '즐겨찾기 추가'} onClick={onToggle} active={active}>
      <StarIcon className="h-[17px] w-[17px]" filled={active} />
    </IconButton>
  )
}

export function KebabMenu({
  onRename,
  onDelete,
}: {
  onRename?: () => void
  onDelete?: () => void
} = {}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative shrink-0">
      <IconButton label="더보기" onClick={() => setOpen((v) => !v)}>
        <MoreIcon className="h-4 w-4" />
      </IconButton>
      {open && (
        <div
          style={{ boxShadow: '0 16px 40px rgba(60,30,38,0.13)' }}
          className="absolute left-0 top-[calc(100%+5px)] z-30 w-[158px] animate-fade-in overflow-hidden rounded-[12px] border border-[#f0e6e8] bg-white p-1.5"
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onRename?.()
            }}
            className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[13px] font-medium text-text-secondary transition-colors hover:bg-brand-subtle hover:text-brand"
          >
            <EditIcon className="h-3.5 w-3.5" />
            이름 바꾸기
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onDelete?.()
            }}
            className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[13px] font-medium text-text-secondary transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            삭제
          </button>
        </div>
      )}
    </div>
  )
}

export function ProjectPath({
  projectName,
  sessionTitle,
}: {
  projectName: string
  sessionTitle?: string | null
}) {
  const hasSession = sessionTitle !== undefined
  const { text, isUntitled } = displaySessionTitle(sessionTitle)

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-[13px] font-medium text-text-muted">{projectName}</span>
      {hasSession && (
        <>
          <span className="shrink-0 text-[13px] text-text-hint">/</span>
          <span className={`truncate text-[15px] ${isUntitled ? 'text-text-muted' : 'font-bold text-text-primary'}`}>
            {text}
          </span>
        </>
      )}
    </div>
  )
}
