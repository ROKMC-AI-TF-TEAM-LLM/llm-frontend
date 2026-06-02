import type { User } from "../../../types";
import { useAuth } from "../../../context/AuthContext";

interface SidebarFooterProps {
  isOpen: boolean;
  user: User;
}

export default function SidebarFooter({ isOpen, user }: SidebarFooterProps) {
  const { logout } = useAuth();

  return (
    <div className={`border-t border-surface-border py-4 flex items-center gap-2 transition-[padding] duration-300 ${isOpen ? "px-4" : "px-[22px]"}`}>
      <button className="flex-1 flex items-center hover:bg-brand-subtle rounded-lg p-1 transition-colors">
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

      {isOpen && (
        <button
          onClick={logout}
          className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors shrink-0 text-text-muted"
          title="로그아웃"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      )}
    </div>
  );
}