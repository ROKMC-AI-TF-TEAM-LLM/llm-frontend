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
      <svg className="sb-icon sb-icon-search" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
        <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
      </svg>
    ),
  },
  {
    label: "문서 검색",
    path: "/rag",
    icon: (
      <svg className="sb-icon sb-icon-folder" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    ),
  },
  {
    label: "번역",
    path: "/translate",
    icon: (
      <svg className="sb-icon sb-icon-translate" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5h7M7.5 5v2c0 3-2 6-4.5 7M6 9c0 2 2.5 4 5 4.5" />
        <path d="M14 20l3.5-9 3.5 9M15 17h5" />
      </svg>
    ),
  },
];

export default function SidebarMenu({ isOpen }: SidebarMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isNewChatActive = location.pathname === "/chat";
  const isItemActive = (path: string) => location.pathname === path;

  const labelCls = `overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] ${
    isOpen ? 'opacity-100 max-w-[140px]' : 'opacity-0 max-w-0'
  }`;

  return (
    <nav className="flex-none px-[10px] pt-[14px] pb-[6px] flex flex-col gap-1">
      <button
        onClick={() => navigate("/chat")}
        title="새 채팅"
        style={
          isNewChatActive
            ? { background: '#fdedf2', color: '#c0002a' }
            : { color: '#1a1917' }
        }
        className="sb-item flex items-center gap-[10px] px-[10px] py-[9px] rounded-[11px] text-[13px] font-semibold hover:bg-[#fdedf2] transition-colors duration-200 cursor-pointer"
      >
        <span className="w-[18px] flex justify-center shrink-0">
          <svg className="sb-icon sb-icon-plus" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <span className={labelCls}>새 채팅</span>
      </button>

      {navItems.map((item) => {
        const isActive = isItemActive(item.path);
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            title={item.label}
            style={
              isActive
                ? { background: '#fdedf2', color: '#c0002a' }
                : { color: '#1a1917' }
            }
            className="sb-item flex items-center gap-[10px] px-[10px] py-[9px] rounded-[11px] text-[13px] font-semibold hover:bg-[#fdedf2] transition-colors duration-200 cursor-pointer"
          >
            <span className="w-[18px] flex justify-center shrink-0">{item.icon}</span>
            <span className={labelCls}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
