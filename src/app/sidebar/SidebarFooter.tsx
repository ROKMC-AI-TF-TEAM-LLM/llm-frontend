import { useState, useRef } from 'react'
import { useEscapeKey } from '@/shared/hooks/useEscapeKey'
import { useClickOutside } from '@/shared/hooks/useClickOutside'
import { useNavigate } from 'react-router-dom'
import type { User } from '@/features/chat/types'
import { useAuth } from '@/features/auth/useAuth'
import { TUTORIALS } from '@/features/landing/tutorials'
import {
  ChevronRightIcon,
  Icon,
  InfoIcon,
  LogoutIcon,
  UserIcon,
} from '@/shared/components/icons'
import MenuItem from '@/shared/components/MenuItem'

interface SidebarFooterProps {
  isOpen: boolean
  user: User
}

export default function SidebarFooter({ isOpen, user }: SidebarFooterProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [subOpen, setSubOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const closeAll = () => {
    setOpen(false)
    setSubOpen(false)
  }
  useEscapeKey(closeAll, open)
  useClickOutside(wrapRef, closeAll, { enabled: open })

  const go = (path: string) => {
    setOpen(false)
    setSubOpen(false)
    navigate(path)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  return (
    <div ref={wrapRef} className="relative border-t border-rose-border">
      {open && (
        <div
          className={`absolute bottom-full mb-2 rounded-2xl border border-surface-border bg-white shadow-[0_16px_40px_rgba(40,30,35,0.16)] p-1.5 z-50 animate-fade-in ${
            isOpen ? 'left-2 right-2' : 'left-2 w-64'
          }`}
        >
          {user.email && (
            <div className="-mx-1.5 mb-1.5 border-b border-surface-border px-4 pb-2 pt-1">
              <p className="text-13 font-semibold text-text-primary truncate">
                {user.name}
              </p>
              <p className="text-12 text-text-muted truncate">{user.email}</p>
            </div>
          )}

          <div
            className="relative"
            onMouseEnter={() => setSubOpen(true)}
            onMouseLeave={() => setSubOpen(false)}
          >
            <MenuItem
              onClick={() => setSubOpen((v) => !v)}
              aria-expanded={subOpen}
              aria-haspopup="true"
              active={subOpen}
            >
              <InfoIcon
                className="h-[18px] w-[18px] shrink-0"
                strokeWidth={1.9}
              />
              자세히 알아보기
              <ChevronRightIcon
                className="ml-auto h-3.5 w-3.5 shrink-0 text-text-muted"
                strokeWidth={2.2}
              />
            </MenuItem>

            {subOpen && (
              <div className="absolute bottom-0 left-full font-semibold z-50 pl-2 animate-fade-in">
                <div className="w-56 rounded-2xl border border-surface-border bg-white p-1.5 shadow-[0_16px_40px_rgba(40,30,35,0.16)]">
                  <SubItem label="서비스 이용법" onClick={() => go('/guide')} />
                  <SubItem label="튜토리얼" onClick={() => go('/tutorials')} />

                  <div className="my-1 mx-3 h-px bg-surface-border" />

                  {TUTORIALS.map((t) => (
                    <SubItem
                      key={t.slug}
                      label={t.title}
                      onClick={() => go(`/tutorials/${t.slug}`)}
                    />
                  ))}

                  <div className="my-1 mx-3 h-px bg-surface-border" />

                  <SubItem label="팀 소개" onClick={() => go('/team')} />
                </div>
              </div>
            )}
          </div>

          {user.role === 'admin' && (
            <MenuItem onClick={() => go('/admin')}>
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9}>
                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </Icon>
              관리자 페이지
            </MenuItem>
          )}

          <div className="my-1 h-px bg-surface-border mx-3" />

          <MenuItem
            danger
            onClick={() => {
              setOpen(false)
              logout()
            }}
          >
            <LogoutIcon className="w-[18px] h-[18px] shrink-0" />
            로그아웃
          </MenuItem>
        </div>
      )}

      <div className="flex items-center gap-1 px-[10px] py-[9px]">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="프로필"
          className={`min-w-0 flex-1 flex items-center gap-2 p-0.5 rounded-[12px] transition-colors cursor-pointer ${open ? 'bg-brand-tint' : 'hover:bg-brand-tint'}`}
        >
          <Avatar />
          <div
            className="flex flex-col items-start min-w-0 overflow-hidden transition-[opacity,width] duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)]"
            style={{ width: isOpen ? '100%' : 0, opacity: isOpen ? 1 : 0 }}
          >
            <span className="max-w-full truncate whitespace-nowrap text-13 font-bold text-text-primary mt-px">
              {user.name}
            </span>
            {user.email && (
              <span className="max-w-full truncate whitespace-nowrap text-11 font-semibold text-text-muted">
                {user.email}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={logout}
          title="로그아웃"
          aria-label="로그아웃"
          tabIndex={isOpen ? 0 : -1}
          className="shrink-0 overflow-hidden rounded-lg text-text-muted hover:bg-red-50 hover:text-red-500 transition-[opacity,width,padding] duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] cursor-pointer"
          style={{
            width: isOpen ? 28 : 0,
            padding: isOpen ? 6 : 0,
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none',
          }}
        >
          <LogoutIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function Avatar() {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        flexShrink: 0,
        background:
          'linear-gradient(135deg,var(--color-brand-vivid),var(--color-brand-vivid-light))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <UserIcon width="15" height="15" stroke="#fff" strokeWidth={2.2} />
    </div>
  )
}

function SubItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <MenuItem onClick={onClick}>
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </MenuItem>
  )
}
