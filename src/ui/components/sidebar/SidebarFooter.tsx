import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { TUTORIALS } from '../../../features/tutorials/tutorials';

interface SidebarFooterProps {
  isOpen: boolean;
  user: User;
}

export default function SidebarFooter({ isOpen, user }: SidebarFooterProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeAll = () => { setOpen(false); setSubOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAll(); };
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) closeAll();
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  const go = (path: string) => {
    setOpen(false);
    setSubOpen(false);
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  return (
    <div ref={wrapRef} className="relative" style={{ borderTop: '1px solid #f4e6ea' }}>
      {open && (
        <div
          className={`absolute bottom-full mb-2 rounded-2xl border border-surface-border bg-white shadow-[0_16px_40px_rgba(40,30,35,0.16)] py-2 z-50 animate-fade-in ${
            isOpen ? 'left-2 right-2' : 'left-2 w-64'
          }`}
        >
          {user.email && (
            <div className="px-4 pb-2 mb-1 border-b border-surface-border">
              <p className="text-[13px] font-semibold text-text-primary truncate">{user.name}</p>
              <p className="text-[12px] text-text-muted truncate">{user.email}</p>
            </div>
          )}

          <div
            className="relative"
            onMouseEnter={() => setSubOpen(true)}
            onMouseLeave={() => setSubOpen(false)}
          >
            <button
              onClick={() => setSubOpen((v) => !v)}
              aria-expanded={subOpen}
              aria-haspopup="true"
              className={`flex w-full items-center gap-3 px-4 py-2 text-[13.5px] transition-colors ${
                subOpen ? 'bg-surface-subtle text-text-primary' : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
              }`}
            >
              <svg className="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              자세히 알아보기
              <svg className="ml-auto h-3.5 w-3.5 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>

            {subOpen && (
              <div className="absolute bottom-0 left-full z-50 pl-2 animate-fade-in">
                <div className="w-56 rounded-2xl border border-surface-border bg-white py-2 shadow-[0_16px_40px_rgba(40,30,35,0.16)]">
                <SubItem label="서비스 이용법" onClick={() => go('/guide')} />
                <SubItem label="튜토리얼" onClick={() => go('/tutorials')} />

                <div className="my-1 mx-3 h-px bg-surface-border" />

                {TUTORIALS.map((t) => (
                  <SubItem key={t.slug} label={t.title} onClick={() => go(`/tutorials/${t.slug}`)} />
                ))}

                <div className="my-1 mx-3 h-px bg-surface-border" />

                <SubItem label="팀 소개" onClick={() => {}} />
                </div>
              </div>
            )}
          </div>

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

      {isOpen ? (
        <div className="flex items-center gap-1 px-[12px] py-[9px]">
          <button
            onClick={() => setOpen((v) => !v)}
            className={`min-w-0 flex-1 flex items-center gap-2 px-[8px] py-[7px] rounded-[11px] transition-colors cursor-pointer ${open ? 'bg-[#fdedf2]' : 'hover:bg-[#fdedf2]'}`}
          >
            <Avatar />
            <div className="flex flex-col items-start min-w-0 overflow-hidden">
              <span className="max-w-full truncate text-[12.5px] font-bold text-text-primary mt-px">{user.name}</span>
              {user.email && (
                <span className="max-w-full truncate text-[11px] text-text-muted">{user.email}</span>
              )}
            </div>
          </button>
          <button
            onClick={logout}
            title="로그아웃"
            aria-label="로그아웃"
            className="shrink-0 p-1.5 rounded-lg text-text-muted hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="flex justify-center py-[9px]">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="프로필"
            className={`p-1.5 rounded-[11px] transition-colors cursor-pointer ${open ? 'bg-[#fdedf2]' : 'hover:bg-[#fdedf2]'}`}
          >
            <Avatar />
          </button>
        </div>
      )}
    </div>
  );
}

function Avatar() {
  return (
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
  );
}

function SubItem({
  label,
  onClick,
  external = false,
}: {
  label: string;
  onClick: () => void;
  external?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 px-4 py-2 text-left text-[13px] text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary"
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {external && (
        <svg className="h-3.5 w-3.5 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
        </svg>
      )}
    </button>
  );
}

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
