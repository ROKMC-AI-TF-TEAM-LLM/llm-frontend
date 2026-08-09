import { useEffect, useMemo, useRef } from "react";
import SidebarHeader from "./SidebarHeader";
import SidebarMenu from "./SidebarMenu";
import FavoriteChats from "./FavoriteChats";
import RecentChats from "./RecentChats";
import SidebarProjects from "./SidebarProjects";
import SidebarFooter from "./SidebarFooter";
import type { ChatItem, User } from "../../../types";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  chats: ChatItem[];
  user: User;
  activeLabel?: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  isInitialLoading?: boolean;
}

export default function Sidebar({ isOpen, onToggle, chats, user, activeLabel, hasMore, onLoadMore, isLoadingMore, isInitialLoading }: SidebarProps) {
  const favorites = useMemo(() => chats.filter((c) => c.isFavorite), [chats]);
  const others = useMemo(() => chats.filter((c) => !c.isFavorite), [chats]);

  const asideRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const aside = asideRef.current;
    if (!aside) return;

    const onWheel = (e: WheelEvent) => {
      const list = listRef.current;
      if (!list) return;
      if (list.contains(e.target as Node)) return;
      e.preventDefault();
      list.scrollTop += e.deltaY;
    };

    aside.addEventListener('wheel', onWheel, { passive: false });
    return () => aside.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <aside
      ref={asideRef}
      style={{ background: 'linear-gradient(190deg,#fdf3f5 0%,#faf6f7 40%,#ffffff 100%)', borderRight: '1px solid #f2e2e6' }}
      className={`fixed inset-y-0 left-0 z-30 flex flex-col overscroll-contain transition-[width] duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] overflow-visible ${
        isOpen ? "w-60" : "w-[56px]"
      }`}
    >
      <SidebarHeader isOpen={isOpen} onToggle={onToggle} />
      <SidebarMenu isOpen={isOpen} activeLabel={activeLabel} />
      <div
        ref={listRef}
        className={`flex-1 min-h-0 overflow-y-auto overscroll-contain ${
          // 접힌 상태에선 스크롤바가 좁은 폭을 잠식하지 않도록 숨긴다.
          isOpen ? 'sidebar-scroll' : 'scrollbar-hide'
        }`}
      >
        <FavoriteChats isOpen={isOpen} favorites={favorites} />
        <SidebarProjects isOpen={isOpen} />
        <RecentChats
          isOpen={isOpen}
          chats={others}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          isLoadingMore={isLoadingMore}
          isInitialLoading={isInitialLoading}
        />
      </div>
      <SidebarFooter isOpen={isOpen} user={user} />
    </aside>
  );
}
