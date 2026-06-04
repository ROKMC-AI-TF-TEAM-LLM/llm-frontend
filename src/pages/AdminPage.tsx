import { useState } from 'react';
import { useGetUsers, useGetMe, useApproveUser, useDeleteUsers, useRejectUser } from '../hooks/useUser';
import type { AdminUserItem } from '../types/user';
import { AdminRowSkeleton } from '../ui/components/Skeleton';
import Toast from '../ui/components/Toast';

type DisplayStatus = 'admin' | 'pending' | 'approved' | 'rejected';
type UserStatusTab = 'all' | 'pending' | 'approved' | 'rejected';

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

const USER_TABS: { label: string; value: UserStatusTab }[] = [
  { label: '전체', value: 'all' },
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

const ADMIN_PAGE_SIZE = 5;
const USER_PAGE_SIZE = 10;

const Pagination = ({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) => {
  if (totalPages <= 1) return null;

  const getPages = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex items-center gap-1 mt-4">
      {getPages().map((p, i) =>
        p === '...' ? (
          <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-text-muted text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
              page === p
                ? 'bg-brand text-white'
                : 'bg-surface text-text-secondary border border-surface-border hover:bg-surface-subtle'
            }`}
          >
            {p}
          </button>
        )
      )}
    </div>
  );
};

export default function AdminPage() {
  const [adminPage, setAdminPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [userStatusTab, setUserStatusTab] = useState<UserStatusTab>('all');
  const [copiedKey, setCopiedKey] = useState(0);
  const [mutationError, setMutationError] = useState('');

  const { data, isLoading, isError } = useGetUsers({ size: 100 });
  const { data: meData } = useGetMe();
  const myEmail = meData?.data?.data?.email;
  const { mutate: approve, isPending: isApproving } = useApproveUser();
  const { mutate: rejectUser, isPending: isRejecting } = useRejectUser();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUsers();

  const allItems = data?.data?.data?.items ?? [];
  const isMutating = isApproving || isRejecting || isDeleting;

  const allAdmins: DisplayUser[] = allItems
    .filter((u) => u.role === 'admin')
    .map((u) => ({ ...u, displayStatus: 'admin' as DisplayStatus }));
  const adminTotalPages = Math.max(1, Math.ceil(allAdmins.length / ADMIN_PAGE_SIZE));
  const pagedAdmins = allAdmins.slice((adminPage - 1) * ADMIN_PAGE_SIZE, adminPage * ADMIN_PAGE_SIZE);

  const allPageUsers: DisplayUser[] = allItems
    .filter((u) => u.role === 'user')
    .map((u) => ({ ...u, displayStatus: u.status as DisplayStatus }));
  const filteredUsers = userStatusTab === 'all' ? allPageUsers : allPageUsers.filter((u) => u.displayStatus === userStatusTab);
  const userTotalPages = Math.max(1, Math.ceil(filteredUsers.length / USER_PAGE_SIZE));
  const pagedUsers = filteredUsers.slice((userPage - 1) * USER_PAGE_SIZE, userPage * USER_PAGE_SIZE);

  const myId = allAdmins.find((u) => u.email === myEmail)?.user_id;

  const TableHeader = () => (
    <thead>
      <tr className="border-b border-surface-border text-left text-text-muted">
        <th className="px-4 py-3 w-[10%]">이름</th>
        <th className="px-4 py-3 w-[22%]">이메일</th>
        <th className="px-4 py-3 w-[30%]">사용자 ID</th>
        <th className="px-4 py-3 w-[11%]">상태</th>
        <th className="px-4 py-3 w-[14%]">가입일</th>
        <th className="px-4 py-3 w-[13%]">처리</th>
      </tr>
    </thead>
  );

  const UserRow = ({ user }: { user: DisplayUser }) => (
    <tr key={user.user_id} className="border-b border-surface-border last:border-0 hover:bg-surface-card1">
      <td className="px-4 py-3 font-medium text-text-primary">{user.name}</td>
      <td className="px-4 py-3 text-text-secondary">{user.email}</td>
      <td className="px-4 py-3">
        <button
          onClick={() => navigator.clipboard.writeText(user.user_id).then(() => setCopiedKey(k => k + 1))}
          title="클릭하여 복사"
          className="font-mono text-xs text-text-muted hover:text-text-primary hover:bg-surface-subtle px-2 py-0.5 rounded transition-colors"
        >
          {user.user_id}
        </button>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[user.displayStatus]}`}>
          {STATUS_LABEL[user.displayStatus]}
        </span>
      </td>
      <td className="px-4 py-3 text-text-muted">
        {new Date(user.created_at).toLocaleDateString('ko-KR')}
      </td>
      <td className="px-4 py-3 flex gap-2">
        {user.displayStatus === 'pending' && (
          <>
            <button
              onClick={() => approve(user.user_id, { onError: (e) => setMutationError(getAdminMutationError(e)) })}
              disabled={isMutating}
              title="승인"
              className="w-6 h-6 flex items-center justify-center rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
            <button
              onClick={() => rejectUser(user.user_id, { onError: (e) => setMutationError(getAdminMutationError(e)) })}
              disabled={isMutating}
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
        {(user.displayStatus === 'rejected' || user.displayStatus === 'approved' || user.displayStatus === 'admin') && (
          <button
            onClick={() => deleteUser(user.user_id, { onError: (e) => setMutationError(getAdminMutationError(e)) })}
            disabled={isMutating || user.user_id === myId}
            className="px-4 py-1 rounded bg-text-secondary text-surface text-xs hover:bg-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            삭제
          </button>
        )}
      </td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-surface-subtle p-8">
      {copiedKey > 0 && (
        <Toast key={copiedKey} message="ID가 복사되었습니다." type="success" onClose={() => setCopiedKey(0)} />
      )}
      {mutationError && (
        <Toast message={mutationError} type="error" onClose={() => setMutationError('')} />
      )}
      {isError && <Toast message="데이터를 불러오지 못했습니다." onClose={() => {}} />}

      <h1 className="text-2xl font-bold text-text-primary mb-8">관리자 - 회원 관리</h1>

      {/* 관리자 섹션 */}
      <section className="mb-10">
        <h2 className="text-base font-semibold text-text-primary mb-3">관리자</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed bg-surface rounded-xl border border-surface-border shadow-sm text-sm">
            <TableHeader />
            <tbody>
              {!isLoading && pagedAdmins.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-muted">관리자가 없습니다.</td>
                </tr>
              )}
              {isLoading
                ? [...Array(3)].map((_, i) => <AdminRowSkeleton key={i} />)
                : pagedAdmins.map((user) => <UserRow key={user.user_id} user={user} />)
              }
            </tbody>
          </table>
        </div>
        <Pagination page={adminPage} totalPages={adminTotalPages} onChange={setAdminPage} />
      </section>

      {/* 유저 섹션 */}
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-3">유저</h2>
        <div className="flex gap-2 mb-4">
          {USER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setUserStatusTab(tab.value); setUserPage(1); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                userStatusTab === tab.value
                  ? 'bg-brand text-white'
                  : 'bg-surface text-text-secondary border border-surface-border hover:bg-surface-subtle'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed bg-surface rounded-xl border border-surface-border shadow-sm text-sm">
            <TableHeader />
            <tbody>
              {!isLoading && pagedUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-muted">해당하는 사용자가 없습니다.</td>
                </tr>
              )}
              {isLoading
                ? [...Array(6)].map((_, i) => <AdminRowSkeleton key={i} />)
                : pagedUsers.map((user) => <UserRow key={user.user_id} user={user} />)
              }
            </tbody>
          </table>
        </div>
        <Pagination page={userPage} totalPages={userTotalPages} onChange={setUserPage} />
      </section>
    </div>
  );
}
