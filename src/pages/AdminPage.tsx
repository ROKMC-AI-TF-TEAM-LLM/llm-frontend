import { useState } from 'react';
import { useGetUsers, useGetMe, useApproveUser, useDeleteUsers, useRejectUser } from '../hooks/useUser';
import type { AdminUserItem } from '../types/user';
import { AdminRowSkeleton } from '../ui/components/Skeleton';
import Toast from '../ui/components/Toast';

type DisplayStatus = 'admin' | 'pending' | 'approved' | 'rejected';
type TabValue = DisplayStatus | 'all';

interface DisplayUser extends AdminUserItem {
  displayStatus: DisplayStatus;
}

const STATUS_LABEL: Record<DisplayStatus, string> = {
  admin: '관리자',
  pending: '대기 중',
  approved: '승인됨',
  rejected: '거절됨',
};

const STATUS_STYLE: Record<DisplayStatus, string> = {
  admin: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const TABS: { label: string; value: TabValue }[] = [
  { label: '전체', value: 'all' },
  { label: '관리자', value: 'admin' },
  { label: '대기 중', value: 'pending' },
  { label: '승인됨', value: 'approved' },
  { label: '거절됨', value: 'rejected' },
];

const ADMIN_MUTATION_ERRORS: Record<string, string> = {
  ADMIN_REQUIRED: '관리자 권한이 필요합니다.',
  USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
  UNAUTHORIZED: '인증이 만료되었습니다. 다시 로그인해주세요.',
};

const getAdminMutationError = (error: unknown): string => {
  const code = (error as any)?.response?.data?.error?.code;
  return ADMIN_MUTATION_ERRORS[code] ?? '처리 중 오류가 발생했습니다.';
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [copiedKey, setCopiedKey] = useState(0);
  const [mutationError, setMutationError] = useState('');
  const { data, isLoading, isError } = useGetUsers();
  const { data: meData } = useGetMe();
  const myEmail = meData?.data?.data?.email;
  const { mutate: approve, isPending: isApproving } = useApproveUser();
  const { mutate: rejectUser, isPending: isRejecting } = useRejectUser();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUsers();

  const responseData = data?.data?.data;

  const allUsers: DisplayUser[] = [
    ...(responseData?.users?.pending ?? []).map((u) => ({ ...u, displayStatus: 'pending' as DisplayStatus })),
    ...(responseData?.users?.rejected ?? []).map((u) => ({ ...u, displayStatus: 'rejected' as DisplayStatus })),
    ...(responseData?.admins ?? []).map((u) => ({ ...u, displayStatus: 'admin' as DisplayStatus })),
    ...(responseData?.users?.approved ?? []).map((u) => ({ ...u, displayStatus: 'approved' as DisplayStatus })),
  ];

  const myId = allUsers.find((u) => u.email === myEmail)?.user_id;

  const users = activeTab === 'all'
    ? allUsers
    : allUsers.filter((u) => u.displayStatus === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {copiedKey > 0 && (
        <Toast key={copiedKey} message="ID가 복사되었습니다." type="success" onClose={() => setCopiedKey(0)} />
      )}
      {mutationError && (
        <Toast message={mutationError} type="error" onClose={() => setMutationError('')} />
      )}
      <h1 className="text-2xl font-bold text-gray-800 mb-4">관리자 - 회원 관리</h1>

      <div className="flex gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-600 border hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isError && <p className="text-red-500">데이터를 불러오지 못했습니다.</p>}

      {!isLoading && users.length === 0 && (
        <p className="text-gray-400">해당하는 사용자가 없습니다.</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-xl shadow text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="px-5 py-3">이름</th>
              <th className="px-5 py-3">이메일</th>
              <th className="px-5 py-3">사용자 ID</th>
              <th className="px-5 py-3">상태</th>
              <th className="px-5 py-3">가입일</th>
              <th className="px-5 py-3">처리</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [...Array(6)].map((_, i) => <AdminRowSkeleton key={i} />)
              : users.map((user) => (
              <tr key={user.user_id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-800">{user.name}</td>
                <td className="px-5 py-3 text-gray-600">{user.email}</td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => navigator.clipboard.writeText(user.user_id).then(() => setCopiedKey(k => k + 1))}
                    title={user.user_id}
                    className="font-mono text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-2 py-0.5 rounded transition-colors"
                  >
                    {user.user_id.slice(0, 8)}…
                  </button>
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[user.displayStatus]}`}>
                    {STATUS_LABEL[user.displayStatus]}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-500">
                  {new Date(user.created_at).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-5 py-3 flex gap-2">
                  {user.displayStatus === 'pending' && (
                    <>
                      <button
                        onClick={() => approve(user.user_id, { onError: (e) => setMutationError(getAdminMutationError(e)) })}
                        disabled={isApproving || isRejecting || isDeleting}
                        title="승인"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => rejectUser(user.user_id, { onError: (e) => setMutationError(getAdminMutationError(e)) })}
                        disabled={isApproving || isRejecting || isDeleting}
                        title="거절"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                      >
                        ✕
                      </button>
                    </>
                  )}
                  {user.displayStatus === 'rejected' && (
                    <button
                      onClick={() => deleteUser(user.user_id, { onError: (e) => setMutationError(getAdminMutationError(e)) })}
                      disabled={isApproving || isRejecting || isDeleting}
                      className="px-3 py-1 rounded bg-gray-500 text-white text-xs hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      삭제
                    </button>
                  )}
                  {(user.displayStatus === 'approved' || user.displayStatus === 'admin') && (
                    <button
                      onClick={() => deleteUser(user.user_id, { onError: (e) => setMutationError(getAdminMutationError(e)) })}
                      disabled={isApproving || isRejecting || isDeleting || user.user_id === myId}
                      className="px-3 py-1 rounded bg-gray-500 text-white text-xs hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      삭제
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
