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
}

export default function Sidebar({ isOpen, onToggle, chats, user }: SidebarProps) {
  return (
    <aside
      className={`flex flex-col h-screen bg-surface border-r border-surface-border transition-[width] duration-300 ease-in-out overflow-hidden ${
        isOpen ? "w-64" : "w-16"
      }`}
    >
      <SidebarHeader isOpen={isOpen} onToggle={onToggle} />
      <SidebarMenu isOpen={isOpen} />
      <div className="flex-1 overflow-y-auto custom-scroll">
        <RecentChats isOpen={isOpen} chats={chats} />
      </div>
      <SidebarFooter isOpen={isOpen} user={user} />
    </aside>
  );
}