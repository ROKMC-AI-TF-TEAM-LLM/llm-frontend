import { useNavigate } from "react-router";

interface SidebarHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function SidebarHeader({ isOpen, onToggle }: SidebarHeaderProps) {
  const navigate = useNavigate();

  return (
    <div
      style={{ height: '60px' }}
      className={`flex-none flex items-center justify-between transition-[padding] duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] ${isOpen ? 'px-[16px]' : 'px-[22px]'}`}
    >
      {/* 로고 (텍스트) — 접힐 때 페이드+슬라이드 아웃 */}
      <div
        onClick={() => navigate("/chat")}
        className={`flex items-center cursor-pointer overflow-hidden transition-[opacity,max-width] duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] ${isOpen ? 'opacity-100 max-w-[120px]' : 'opacity-0 max-w-0'}`}
      >
        <span
          style={{ fontSize: 18, fontWeight: 900, letterSpacing: '0.06em', color: '#e4002b', whiteSpace: 'nowrap' }}
        >
          MARS
        </span>
      </div>

      {/* 토글 버튼 (패널 아이콘 + 커스텀 호버 툴팁) */}
      <button
        onClick={onToggle}
        style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0 }}
        className="relative group flex items-center justify-center border-none bg-transparent text-[#9a8a90] hover:bg-[#f7edf0] hover:text-[#c0002a] transition-colors cursor-pointer"
        aria-label={isOpen ? '사이드바 접기' : '사이드바 펴기'}
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" />
        </svg>
        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-semibold text-white bg-[#2c2b30] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {isOpen ? '사이드바 접기' : '사이드바 펴기'}
        </span>
      </button>
    </div>
  );
}
