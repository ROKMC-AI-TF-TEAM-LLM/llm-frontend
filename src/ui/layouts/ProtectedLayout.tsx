import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../components/sidebar/Sidebar";
import { useState, useEffect, type CSSProperties } from "react";
import { useGetMe } from "../../hooks/useUser";
import { useInfiniteSessions } from "../../hooks/useSession";
import { SidebarSkeleton } from "../components/Skeleton";
import ErrorBoundary from "../components/ErrorBoundary";
import type { ApiError } from "../../utils/error";

const ProtectedLayout = () => {
  const { accessToken, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const { data: meData, isError, error: meError, isLoading } = useGetMe();
  const { data: sessionsInfinite, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading: isSessionsLoading } = useInfiniteSessions();

  useEffect(() => {
    if (isError) {
      const status = (meError as ApiError)?.response?.status
      if (status === 401) {
        logout()
      }
    }
  }, [isError, meError, logout]);

  if (!accessToken) {
    return <Navigate to='/' replace />;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <SidebarSkeleton />
        <div className="flex-1 min-w-0" />
      </div>
    );
  }

  if (isError) {
    const status = (meError as ApiError)?.response?.status;
    if (status === 401) {
      return (
        <div className="flex h-screen">
          <SidebarSkeleton />
          <div className="flex-1 min-w-0" />
        </div>
      );
    }
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-text-secondary">서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.</p>
      </div>
    );
  }

  const userData = meData?.data?.data;
  const user = userData
    ? { id: '', name: userData.name, email: userData.email, role: userData.role, createdAt: userData.created_at }
    : { id: '', name: '사용자' };

  // 서버 응답(SessionData) -> 화면 모델(ChatItem) 매핑 지점.
  // 목록 API가 is_favorite를 안 내려주면 undefined → false(즐겨찾기 없음)로 취급한다.
  const chats = (sessionsInfinite?.pages ?? [])
    .flatMap((page) => page.data.data.items)
    .map((s) => ({ id: s.session_id, title: s.title, isFavorite: s.is_favorite ?? false }));

  return (
    <>
      <Sidebar
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        chats={chats}
        user={user}
        hasMore={!!hasNextPage}
        onLoadMore={fetchNextPage}
        isInitialLoading={isSessionsLoading}
        isLoadingMore={isFetchingNextPage}
      />
      <main
        style={{ '--sidebar-width': isOpen ? '15rem' : '56px' } as CSSProperties}
        className={`h-screen overflow-hidden transition-[margin-left] duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] ${isOpen ? 'ml-60' : 'ml-[56px]'}`}
      >
        <ErrorBoundary>
          <div key={location.pathname} className="h-full">
            <Outlet />
          </div>
        </ErrorBoundary>
      </main>
    </>
  );
}

export default ProtectedLayout;
