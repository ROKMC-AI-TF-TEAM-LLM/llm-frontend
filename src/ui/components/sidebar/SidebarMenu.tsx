import { useNavigate, useLocation } from "react-router";

interface SidebarMenuProps {
  isOpen: boolean;
  activeLabel?: string;
}

const menuItems = [
  {
    label: "새 채팅",
    path: "/chat",
    exact: true,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    label: "대화 검색",
    path: "/search",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    label: "문서 검색",
    path: "/rag",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
      </svg>
    ),
  },
];

export default function SidebarMenu({ isOpen }: SidebarMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="px-3 py-2 space-y-1">
      {menuItems.map((item) => {
        const isActive = item.exact
          ? location.pathname === item.path
          : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center py-2.5 rounded-lg text-sm transition-[padding,colors] duration-300 ${
              isOpen ? "px-3" : "px-[18px]"
            } ${
              isActive
                ? "bg-brand-subtle text-brand font-medium"
                : "text-text-primary hover:bg-brand-subtle hover:text-brand"
            }`}
          >
            <span className="shrink-0">{item.icon}</span>
            <span
              className={`whitespace-nowrap transition-[opacity,margin] duration-300 ${
                isOpen ? "opacity-100 ml-3" : "opacity-0 w-0 overflow-hidden ml-0"
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}

      {[
        { label: '팀 소개', url: 'https://channel.io/ko/team', icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 7a3 3 0 106 0 3 3 0 00-6 0M22 20v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
        ) },
        { label: '서비스 이용법', url: 'https://channel.io/ko/team', icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9a2.5 2.5 0 114.5 1.5c-.7.8-1.5 1.2-1.5 2.5M12 17h.01" /></svg>
        ) },
      ].map((item) => (
        <button
          key={item.label}
          onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
          className={`w-full flex items-center py-2.5 rounded-lg text-sm transition-[padding,colors] duration-300 text-text-primary hover:bg-brand-subtle hover:text-brand ${isOpen ? 'px-3' : 'px-[18px]'}`}
        >
          <span className="shrink-0">{item.icon}</span>
          <span className={`whitespace-nowrap transition-[opacity,margin] duration-300 ${isOpen ? 'opacity-100 ml-3' : 'opacity-0 w-0 overflow-hidden ml-0'}`}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}