import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../components/sidebar/Sidebar";
import { useState, useEffect } from "react";
import { useGetMe } from "../../hooks/useUser";
import { useInfiniteSessions } from "../../hooks/useSession";
import { SidebarSkeleton } from "../components/Skeleton";

const ProtectedLayout = () => {
  const { accessToken, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const { data: meData, isError, error: meError, isLoading } = useGetMe();
  const { data: sessionsInfinite, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading: isSessionsLoading } = useInfiniteSessions();

  useEffect(() => {
    if (isError) {
      const status = (meError as any)?.response?.status
      if (status === 401) {
        logout()
      }
      // 네트워크 오류 등 인증과 무관한 에러는 로그아웃 하지 않음 (TanStack Query가 자동 재시도)
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
    const status = (meError as any)?.response?.status;
    if (status !== 401) {
      return (
        <div className="flex h-screen items-center justify-center">
          <p className="text-sm text-text-secondary">서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.</p>
        </div>
      );
    }
    return null;
  }

  const userData = meData?.data?.data;
  const user = userData
    ? { id: '', name: userData.name, email: userData.email }
    : { id: '', name: '사용자' };

  const chats = (sessionsInfinite?.pages ?? [])
    .flatMap((page) => page.data.data.items)
    .map((s) => ({ id: s.session_id, title: s.title }));

  return (
    <div className="flex h-screen">
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
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

export default ProtectedLayout;
