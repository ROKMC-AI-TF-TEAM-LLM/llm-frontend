import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

interface SidebarFooterProps {
  isOpen: boolean;
  user: User;
}

const CHANNEL_URL = 'https://channel.io/ko/team';

export default function SidebarFooter({ isOpen, user }: SidebarFooterProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!showMenu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowMenu(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showMenu]);

  const menuItemCls =
    'w-full flex items-center gap-3 px-3.5 py-2 text-sm text-text-primary hover:bg-brand-subtle transition-colors';

  return (
    <>
      {showMenu && (
        <>
          {/* 바깥 클릭 닫기 */}
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />

          {/* 클로드식 드롭다운 (프로필 버튼 위로 뜸) */}
          <div className="fixed left-3 bottom-[76px] w-60 z-50 bg-surface rounded-2xl shadow-xl border border-surface-border py-1 animate-fade-in">
            <div className="px-3.5 pt-1.5 pb-1">
              <p className="text-xs text-text-secondary truncate">{user.email ?? user.name}</p>
            </div>

            <div className="h-px bg-surface-border my-1" />

            <button
              className={menuItemCls}
              onClick={() => { setShowMenu(false); window.open(CHANNEL_URL, '_blank', 'noopener,noreferrer'); }}
            >
              <svg className="w-[18px] h-[18px] text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 7a3 3 0 106 0 3 3 0 00-6 0M22 20v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
              팀 소개
            </button>

            <button
              className={menuItemCls}
              onClick={() => { setShowMenu(false); window.open(CHANNEL_URL, '_blank', 'noopener,noreferrer'); }}
            >
              <svg className="w-[18px] h-[18px] text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9a2.5 2.5 0 114.5 1.5c-.7.8-1.5 1.2-1.5 2.5M12 17h.01" />
              </svg>
              서비스 이용법
            </button>

            {user.role === 'admin' && (
              <button
                className={menuItemCls}
                onClick={() => { setShowMenu(false); navigate('/admin'); }}
              >
                <svg className="w-[18px] h-[18px] text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                관리자 페이지
              </button>
            )}

            <div className="h-px bg-surface-border my-1" />

            <button
              className="w-full flex items-center gap-3 px-3.5 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
              onClick={() => { setShowMenu(false); logout(); }}
            >
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              로그아웃
            </button>
          </div>
        </>
      )}

      <div style={{ borderTop: '1px solid #f4e6ea' }} className="flex-none px-[12px] py-[9px]">
        <button
          onClick={() => setShowMenu((v) => !v)}
          className={`w-full flex items-center gap-2 px-[11px] py-[7px] rounded-[11px] transition-colors cursor-pointer ${showMenu ? 'bg-[#f2c9d6]' : 'hover:bg-[#f2c9d6]'}`}
        >
          {/* 아바타 */}
          <div
            style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#e4002b,#ff2d55)',
              boxShadow: '0 4px 11px rgba(228,0,43,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </div>

          {/* 이름 */}
          <div className={`flex flex-col items-start min-w-0 overflow-hidden transition-[opacity,max-width] duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] ${isOpen ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0'}`}>
            <span className="text-[12.5px] font-bold text-text-primary whitespace-nowrap">{user.name}</span>
          </div>
        </button>
      </div>
    </>
  );
}
