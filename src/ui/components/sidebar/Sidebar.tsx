import SidebarHeader from "./SidebarHeader";
import SidebarMenu from "./SidebarMenu";
import FavoriteChats from "./FavoriteChats";
import RecentChats from "./RecentChats";
import SidebarFooter from "./SidebarFooter";
import type { User } from "../../../types";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  user: User;
  activeLabel?: string;
}

// 두 섹션은 각자 별도 API로 목록을 가져온다(즐겨찾기: is_favorite=true / 최근: is_favorite=false).
// 하나의 목록을 필터링하지 않는 이유: 무한스크롤로 아직 안 불러온 페이지의 즐겨찾기가 누락되기 때문.
export default function Sidebar({ isOpen, onToggle, user, activeLabel }: SidebarProps) {
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
        <FavoriteChats isOpen={isOpen} />
        <RecentChats isOpen={isOpen} />
      </div>
      <SidebarFooter isOpen={isOpen} user={user} />
    </aside>
  );
}
