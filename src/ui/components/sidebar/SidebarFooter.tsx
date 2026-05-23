import type { User } from "../../../types";
import { useAuth } from "../../../context/AuthContext";

interface SidebarFooterProps {
  isOpen: boolean;
  user: User;
}

export default function SidebarFooter({ isOpen, user }: SidebarFooterProps) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/signin';
  };

  return (
    <div className="border-t border-surface-border px-4 py-4 flex items-center gap-2">
      <button className="flex-1 flex items-center gap-3 hover:bg-brand-subtle rounded-lg p-1 transition-colors">
        <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div
          className={`flex flex-col items-start min-w-0 transition-opacity duration-200 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        >
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
          onClick={handleLogout}
          className="p-1 rounded-lg hover:bg-brand-subtle transition-colors shrink-0 text-sm text-text-muted"
          title="로그아웃"
        >
          로그아웃
        </button>
      )}
    </div>
  );
}
