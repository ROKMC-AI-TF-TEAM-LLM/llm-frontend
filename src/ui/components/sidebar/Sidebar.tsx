import { useMemo } from "react";
import SidebarHeader from "./SidebarHeader";
import SidebarMenu from "./SidebarMenu";
import FavoriteChats from "./FavoriteChats";
import RecentChats from "./RecentChats";
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
  // 즐겨찾기는 별도 상태로 저장하지 않는다 — 세션 목록 하나를 진실로 두고 '파생'시킨다.
  // (두 곳에 저장하면 삭제/이름변경/토글 때마다 어긋난다)
  const favorites = useMemo(() => chats.filter((c) => c.isFavorite), [chats]);
  const others = useMemo(() => chats.filter((c) => !c.isFavorite), [chats]);

  return (
    <aside
      style={{ background: 'linear-gradient(190deg,#fdf3f5 0%,#faf6f7 40%,#ffffff 100%)', borderRight: '1px solid #f2e2e6' }}
      className={`fixed inset-y-0 left-0 z-30 flex flex-col transition-[width] duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] overflow-visible ${
        isOpen ? "w-60" : "w-[56px]"
      }`}
    >
      <SidebarHeader isOpen={isOpen} onToggle={onToggle} />
      <SidebarMenu isOpen={isOpen} activeLabel={activeLabel} />
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <FavoriteChats isOpen={isOpen} favorites={favorites} />
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
