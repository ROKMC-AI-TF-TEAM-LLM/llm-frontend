import { useState, useEffect } from 'react';
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
            className="bg-surface rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden animate-fade-in"
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

            {/* 관리자 페이지(관리자만) + 로그아웃 */}
            <div className="px-6 py-4 space-y-2">
              {user.role === 'admin' && (
                <button
                  onClick={() => { setShowModal(false); navigate('/admin'); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-brand-subtle transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  관리자 페이지
                </button>
              )}
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

      <div style={{ borderTop: '1px solid #f4e6ea' }} className="flex-none flex items-center gap-1 px-[8px] py-[9px]">
        <button
          onClick={() => setShowModal(true)}
          className={`flex-1 min-w-0 flex items-center gap-2 px-[6px] py-[7px] rounded-[11px] transition-colors cursor-pointer ${showModal ? 'bg-[#fdedf2]' : 'hover:bg-[#fdedf2]'}`}
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
        </button>

        {isOpen && (
          <button
            onClick={logout}
            title="로그아웃"
            aria-label="로그아웃"
            className="shrink-0 p-1.5 rounded-lg text-text-muted hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        )}
      </div>
    </>
  );
}
