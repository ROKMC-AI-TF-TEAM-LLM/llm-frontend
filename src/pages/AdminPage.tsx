import { useGetUsers, useApproveUser, useRejectUser } from '../hooks/useUser';
import type { UserData } from '../types/user';

const STATUS_LABEL: Record<string, string> = {
  pending: '대기 중',
  approved: '승인됨',
  rejected: '거절됨',
};

export default function AdminPage() {
  const { data, isLoading, isError } = useGetUsers({ status: 'pending' });
  const { mutate: approve, isPending: isApproving } = useApproveUser();
  const { mutate: reject, isPending: isRejecting } = useRejectUser();

  const users: UserData[] = data?.data?.data?.items ?? [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">관리자 - 가입 승인</h1>

      {isLoading && <p className="text-gray-500">불러오는 중...</p>}
      {isError && <p className="text-red-500">데이터를 불러오지 못했습니다.</p>}

      {!isLoading && users.length === 0 && (
        <p className="text-gray-400">승인 대기 중인 사용자가 없습니다.</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-xl shadow text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="px-5 py-3">이름</th>
              <th className="px-5 py-3">이메일</th>
              <th className="px-5 py-3">상태</th>
              <th className="px-5 py-3">가입일</th>
              <th className="px-5 py-3">처리</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-800">{user.name}</td>
                <td className="px-5 py-3 text-gray-600">{user.email}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    user.status === 'approved' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {STATUS_LABEL[user.status] ?? user.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-500">
                  {new Date(user.created_at).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-5 py-3 flex gap-2">
                  <button
                    onClick={() => approve(user.user_id)}
                    disabled={isApproving || isRejecting}
                    className="px-3 py-1 rounded bg-green-500 text-white text-xs hover:bg-green-600 disabled:opacity-50"
                  >
                    승인
                  </button>
                  <button
                    onClick={() => reject(user.user_id)}
                    disabled={isApproving || isRejecting}
                    className="px-3 py-1 rounded bg-red-500 text-white text-xs hover:bg-red-600 disabled:opacity-50"
                  >
                    거절
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
