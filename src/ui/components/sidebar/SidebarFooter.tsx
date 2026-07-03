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

      <div className={`border-t border-surface-border py-4 flex items-center gap-2 transition-[padding] duration-300 ${isOpen ? "px-4" : "px-[22px]"}`}>
        <button
          className={`flex-1 flex items-center rounded-lg p-1 transition-colors ${showMenu ? 'bg-brand-subtle' : 'hover:bg-brand-subtle'}`}
          onClick={() => setShowMenu((v) => !v)}
        >
          <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className={`flex flex-col items-start min-w-0 transition-[opacity,margin] duration-300 ${
            isOpen ? "opacity-100 ml-3" : "opacity-0 w-0 overflow-hidden ml-0"
          }`}>
            <span className="text-sm text-text-primary font-medium whitespace-nowrap">
              {user.name}
            </span>
          </div>
        </button>
      </div>
    </>
  );
}
