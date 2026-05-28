import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useGetUsers } from '../../hooks/useUser';

const AdminLayout = () => {
  const { accessToken } = useAuth();
  const { isLoading, isError } = useGetUsers();

  if (accessToken) {
    return <Navigate to='/chat' replace />
  }


  if (!accessToken) {
    return <Navigate to='/' replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">확인 중...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <span className="text-6xl">🚫</span>
        <h1 className="text-2xl font-bold text-gray-800">접근 권한이 없습니다</h1>
        <p className="text-gray-500">관리자 계정으로 로그인해주세요.</p>
      </div>
    );
  }

  return <Outlet />;
};

export default AdminLayout;
