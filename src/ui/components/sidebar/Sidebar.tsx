import SidebarHeader from "./SidebarHeader";
import SidebarMenu from "./SidebarMenu";
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
  return (
    <aside
      className={`flex flex-col h-screen bg-surface-card2 border-r border-surface-border transition-[width] duration-300 ease-in-out overflow-hidden ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      <SidebarHeader isOpen={isOpen} onToggle={onToggle} />
      <SidebarMenu isOpen={isOpen} activeLabel={activeLabel} />
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <RecentChats isOpen={isOpen} chats={chats} hasMore={hasMore} onLoadMore={onLoadMore} isLoadingMore={isLoadingMore} isInitialLoading={isInitialLoading} />
      </div>
      <SidebarFooter isOpen={isOpen} user={user} />
    </aside>
  );
}