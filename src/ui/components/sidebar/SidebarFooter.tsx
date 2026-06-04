import { useState, useEffect } from 'react';
import type { User } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

interface SidebarFooterProps {
  isOpen: boolean;
  user: User;
}

export default function SidebarFooter({ isOpen, user }: SidebarFooterProps) {
  const { logout } = useAuth();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!showModal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowModal(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showModal]);

  return (
    <>
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-surface rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더: 아바타 + 이름 + 이메일 */}
            <div className="relative px-6 pt-6 pb-5 flex flex-col items-center text-center border-b border-surface-border">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
                aria-label="닫기"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="w-14 h-14 rounded-full bg-brand flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-base font-semibold text-text-primary">{user.name}</p>
              {user.email && (
                <p className="text-sm text-text-muted mt-0.5">{user.email}</p>
              )}
            </div>

            {/* 상세 정보 */}
            <div className="px-6 py-5 space-y-4 border-b border-surface-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted">역할</span>
                <span className={[
                  'text-[11px] font-medium px-2.5 py-0.5 rounded-full',
                  user.role === 'admin'
                    ? 'bg-brand-soft text-brand'
                    : 'bg-surface-border text-text-secondary',
                ].join(' ')}>
                  {user.role === 'admin' ? '관리자' : '사용자'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted">가입일</span>
                <span className="text-sm text-text-secondary">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '-'}
                </span>
              </div>
            </div>

            {/* 로그아웃 */}
            <div className="px-6 py-4">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`border-t border-surface-border py-4 flex items-center transition-[padding] duration-300 ${isOpen ? "px-4" : "px-[22px]"}`}>
        <button
          className="flex-1 flex items-center hover:bg-brand-subtle rounded-lg p-1 transition-colors"
          onClick={() => setShowModal(true)}
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
            {user.email && (
              <span className="text-xs text-text-muted whitespace-nowrap truncate max-w-32">
                {user.email}
              </span>
            )}
          </div>
        </button>
      </div>
    </>
  );
}
