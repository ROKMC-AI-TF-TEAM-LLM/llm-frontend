import { useEffect, useMemo, useRef } from "react";
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

  const asideRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 사이드바 어디에 커서를 두든(헤더·메뉴·푸터 포함) 휠은 세션 목록을 스크롤한다.
  // 그렇게 하지 않으면 스크롤 대상이 없는 영역의 휠이 부모로 전파돼 뒤의 채팅이 스크롤된다.
  // React의 onWheel은 passive라 preventDefault가 통하지 않으므로 네이티브 리스너로 등록한다.
  useEffect(() => {
    const aside = asideRef.current;
    if (!aside) return;

    const onWheel = (e: WheelEvent) => {
      const list = listRef.current;
      if (!list) return;
      // 목록 안에서 시작한 휠은 브라우저 기본 동작에 맡긴다(overscroll-contain이 체이닝을 막아준다).
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
      {/* 헤더·메뉴·푸터는 고정, 세션 목록만 스크롤한다(스크롤바도 이 영역에서 시작).
          min-h-0: flex 자식이 내용 높이만큼 늘어나 스크롤이 안 생기는 것을 막는다.
          overscroll-contain: 목록 끝에 닿아도 스크롤이 뒤(채팅)로 넘어가지 않게 한다. */}
      <div
        ref={listRef}
        className={`flex-1 min-h-0 overflow-y-auto overscroll-contain ${
          // 접힌 상태에선 스크롤바가 좁은 폭을 잠식하지 않도록 숨긴다.
          isOpen ? 'sidebar-scroll' : 'scrollbar-hide'
        }`}
      >
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
