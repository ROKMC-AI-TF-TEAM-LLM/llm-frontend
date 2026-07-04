import { useNavigate, useLocation } from "react-router";

interface SidebarMenuProps {
  isOpen: boolean;
  activeLabel?: string;
}

const navItems = [
  {
    label: "대화 검색",
    path: "/search",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
        <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
      </svg>
    ),
  },
  {
    label: "문서 검색",
    path: "/rag",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    ),
  },
];

export default function SidebarMenu({ isOpen }: SidebarMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isNewChatActive = location.pathname === "/chat";
  const isSearchActive = location.pathname === "/search";
  const isDocsActive   = location.pathname === "/rag";

  // 라벨: 접힐 때 페이드+슬라이드 아웃 (폭 애니메이션과 동일 타이밍)
  const labelCls = `overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] ${
    isOpen ? 'opacity-100 max-w-[140px]' : 'opacity-0 max-w-0'
  }`;

  return (
    <nav className="flex-none px-[12px] pt-[14px] pb-[6px] flex flex-col gap-1">
      {/* 새 채팅 */}
      <button
        onClick={() => navigate("/chat")}
        title="새 채팅"
        style={
          isNewChatActive
            ? { background: '#fdeef1', color: '#c0002a' }
            : { color: '#5a5560' }
        }
        className="flex items-center gap-[10px] px-[16px] py-[9px] rounded-[11px] text-[13px] font-semibold hover:bg-[#f2c9d6] transition-colors duration-200 cursor-pointer"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" style={{ flexShrink: 0 }}>
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span className={labelCls}>새 채팅</span>
      </button>

      {/* 대화 검색 / 문서 검색 */}
      {navItems.map((item) => {
        const isActive = item.path === '/search' ? isSearchActive : isDocsActive;
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            title={item.label}
            style={
              isActive
                ? { background: '#fdeef1', color: '#c0002a' }
                : { color: '#5a5560' }
            }
            className="flex items-center gap-[10px] px-[16px] py-[9px] rounded-[11px] text-[13px] font-semibold hover:bg-[#f2c9d6] transition-colors duration-200 cursor-pointer"
          >
            <span style={{ flexShrink: 0 }}>{item.icon}</span>
            <span className={labelCls}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
