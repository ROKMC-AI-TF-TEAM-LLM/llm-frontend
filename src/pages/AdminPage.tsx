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
  rejected: 'bg-brand-subtle text-brand',
};

const TABS: { label: string; value: TabValue }[] = [
  { label: '전체', value: 'all' },
  { label: '관리자', value: 'admin' },
  { label: '대기 중', value: 'pending' },
  { label: '승인됨', value: 'approved' },
  { label: '거절됨', value: 'rejected' },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const { data, isLoading, isError } = useGetUsers();
  const { data: meData } = useGetMe();
  const myEmail = meData?.data?.data?.email;
  const { mutate: approve, isPending: isApproving } = useApproveUser();
  const { mutate: rejectUser, isPending: isRejecting } = useRejectUser();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUsers();

  const responseData = data?.data?.data;

  const allUsers: DisplayUser[] = [
    ...(responseData?.admins ?? []).map((u) => ({ ...u, displayStatus: 'admin' as DisplayStatus })),
    ...(responseData?.users?.pending ?? []).map((u) => ({ ...u, displayStatus: 'pending' as DisplayStatus })),
    ...(responseData?.users?.approved ?? []).map((u) => ({ ...u, displayStatus: 'approved' as DisplayStatus })),
    ...(responseData?.users?.rejected ?? []).map((u) => ({ ...u, displayStatus: 'rejected' as DisplayStatus })),
  ];

  const myId = allUsers.find((u) => u.email === myEmail)?.user_id;

  const users = activeTab === 'all'
    ? allUsers
    : allUsers.filter((u) => u.displayStatus === activeTab);

  return (
    <div className="min-h-screen bg-surface-subtle p-8">
      <h1 className="text-2xl font-bold text-text-primary mb-4">회원 관리</h1>

      <div className="flex gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-brand text-white'
                : 'bg-surface text-text-secondary border border-surface-border hover:bg-surface-subtle'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isError && <Toast message="데이터를 불러오지 못했습니다." onClose={() => {}} />}

      <div className="overflow-x-auto">
        <table className="w-full table-fixed bg-surface rounded-xl border border-surface-border shadow-sm text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-text-muted">
              <th className="px-5 py-3 w-[15%]">이름</th>
              <th className="px-5 py-3 w-[35%]">이메일</th>
              <th className="px-5 py-3 w-[15%]">상태</th>
              <th className="px-5 py-3 w-[20%]">가입일</th>
              <th className="px-5 py-3 w-[15%]">처리</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-text-muted">
                  해당하는 사용자가 없습니다.
                </td>
              </tr>
            )}
            {isLoading
              ? [...Array(6)].map((_, i) => <AdminRowSkeleton key={i} />)
              : users.map((user) => (
              <tr key={user.user_id} className="border-b border-surface-border last:border-0 hover:bg-surface-card1">
                <td className="px-5 py-3 font-medium text-text-primary">{user.name}</td>
                <td className="px-5 py-3 text-text-secondary">{user.email}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[user.displayStatus]}`}>
                    {STATUS_LABEL[user.displayStatus]}
                  </span>
                </td>
                <td className="px-5 py-3 text-text-muted">
                  {new Date(user.created_at).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-5 py-3 flex gap-2">
                  {user.displayStatus === 'pending' && (
                    <>
                      <button
                        onClick={() => approve(user.user_id)}
                        disabled={isApproving || isRejecting || isDeleting}
                        title="승인"
                        className="w-6 h-6 flex items-center justify-center rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>
                      <button
                        onClick={() => rejectUser(user.user_id)}
                        disabled={isApproving || isRejecting || isDeleting}
                        title="거절"
                        className="w-6 h-6 flex items-center justify-center rounded bg-brand text-white hover:bg-brand-hover disabled:opacity-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </>
                  )}
                  {user.displayStatus === 'rejected' && (
                    <button
                      onClick={() => deleteUser(user.user_id)}
                      disabled={isApproving || isRejecting || isDeleting}
                      className="px-4 py-1 rounded bg-text-secondary text-surface text-xs hover:bg-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      삭제
                    </button>
                  )}
                  {(user.displayStatus === 'approved' || user.displayStatus === 'admin') && (
                    <button
                      onClick={() => deleteUser(user.user_id)}
                      disabled={isApproving || isRejecting || isDeleting || user.user_id === myId}
                      className="px-4 py-1 rounded bg-text-secondary text-surface text-xs hover:bg-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
