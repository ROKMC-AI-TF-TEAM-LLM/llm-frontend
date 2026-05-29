import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useGetUsers } from '../../hooks/useUser';
import { Skeleton, AdminRowSkeleton } from '../components/Skeleton';

const AdminLayout = () => {
  const { accessToken } = useAuth();
  const { isLoading, isError } = useGetUsers();

  if (!accessToken) {
    return <Navigate to='/' replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="flex gap-2 mb-6">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-16 rounded-full" />)}
        </div>
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="border-b px-5 py-3 flex gap-5">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-4 w-20" />)}
          </div>
          <table className="w-full"><tbody>
            {[...Array(6)].map((_, i) => <AdminRowSkeleton key={i} />)}
          </tbody></table>
        </div>
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
