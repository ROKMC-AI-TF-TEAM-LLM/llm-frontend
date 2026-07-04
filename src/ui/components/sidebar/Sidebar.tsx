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
      style={{ background: 'linear-gradient(190deg,#fdf3f5 0%,#faf6f7 40%,#ffffff 100%)', borderRight: '1px solid #f2e2e6' }}
      className={`fixed inset-y-0 left-0 z-30 flex flex-col transition-[width] duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] overflow-hidden ${
        isOpen ? "w-60" : "w-[74px]"
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
