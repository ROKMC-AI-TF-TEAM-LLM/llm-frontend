import type { ChatItem } from "../../../types";

interface RecentChatsProps {
  isOpen: boolean;
  chats: ChatItem[];
}

export default function RecentChats({ isOpen, chats }: RecentChatsProps) {
  if (!isOpen) return null;

  return (
    <div className="px-3 pt-4 overflow-hidden">
      <p className="px-3 text-xs text-text-muted mb-2">최근 대화</p>
      <ul className="space-y-1">
        {chats.map((chat) => (
          <li key={chat.id}>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-text-primary hover:bg-brand-subtle hover:text-brand transition-colors text-sm text-left">
              <span className="truncate">{chat.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}