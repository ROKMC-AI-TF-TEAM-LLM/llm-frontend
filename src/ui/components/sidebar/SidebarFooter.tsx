import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

interface SidebarFooterProps {
  isOpen: boolean;
  user: User;
}

export default function SidebarFooter({ isOpen, user }: SidebarFooterProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // ESC + 바깥 클릭으로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  const go = (path: string) => { setOpen(false); navigate(path); };

  return (
    <div ref={wrapRef} className="relative" style={{ borderTop: '1px solid #f4e6ea' }}>
      {/* 위로 뜨는 팝업 메뉴 (Claude 스타일) */}
      {open && (
        <div className="absolute bottom-full left-2 right-2 mb-2 rounded-2xl border border-surface-border bg-white shadow-[0_16px_40px_rgba(40,30,35,0.16)] py-2 z-50 animate-fade-in">
          {/* 헤더: 이메일 */}
          {user.email && (
            <div className="px-4 pb-2 mb-1 border-b border-surface-border">
              <p className="text-[13px] font-semibold text-text-primary truncate">{user.name}</p>
              <p className="text-[12px] text-text-muted truncate">{user.email}</p>
            </div>
          )}

          <MenuItem
            icon={<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 .01M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />}
            label="팀 소개"
            onClick={() => go('/guide')}
          />
          <MenuItem
            icon={<><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" /></>}
            label="서비스 이용법"
            onClick={() => go('/guide')}
          />
          {user.role === 'admin' && (
            <MenuItem
              icon={<><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>}
              label="관리자 페이지"
              onClick={() => go('/admin')}
            />
          )}

          <div className="my-1 h-px bg-surface-border mx-3" />

          <button
            onClick={() => { setOpen(false); logout(); }}
            className="w-full flex items-center gap-3 px-4 py-2 text-[13.5px] text-red-500 hover:bg-red-50 transition-colors"
          >
            <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            로그아웃
          </button>
        </div>
      )}

      {/* 프로필 버튼 */}
      <div className="flex items-center gap-1 px-[8px] py-[9px]">
        <button
          onClick={() => setOpen((v) => !v)}
          className={`flex-1 min-w-0 flex items-center gap-2 px-[6px] py-[7px] rounded-[11px] transition-colors cursor-pointer ${open ? 'bg-[#fdedf2]' : 'hover:bg-[#fdedf2]'}`}
        >
          {/* 아바타 */}
          <div
            style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#e4002b,#ff2d55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </div>

          {/* 이름 + 이메일 */}
          <div className={`flex flex-col items-start min-w-0 overflow-hidden transition-[opacity,max-width] duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] ${isOpen ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0'}`}>
            <span className="max-w-full truncate text-[12.5px] font-bold text-text-primary">{user.name}</span>
            {user.email && (
              <span className="max-w-full truncate text-[11px] text-text-muted">{user.email}</span>
            )}
          </div>

          {/* 펼침 화살표 */}
          {isOpen && (
            <svg className={`shrink-0 ml-auto w-4 h-4 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

// 팝업 메뉴 한 줄
function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2 text-[13.5px] text-text-secondary hover:bg-surface-subtle hover:text-text-primary transition-colors"
    >
      <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
        {icon}
      </svg>
      {label}
    </button>
  );
}
