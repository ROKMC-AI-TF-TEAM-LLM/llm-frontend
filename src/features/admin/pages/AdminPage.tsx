import { useState, useEffect } from 'react';
import { useGetUsers, useGetMe, useApproveUser, useDeleteUsers, useRejectUser } from '@/features/users/hooks';
import { AdminRowSkeleton } from '@/shared/components/Skeleton';
import { showToast } from '@/shared/store/toastStore';
import { logError } from '@/shared/utils/logError';
import { copyText } from '@/shared/utils/clipboard';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import AdminDocuments from '../components/AdminDocuments';
import { getAdminMutationError, type DisplayStatus, type UserStatusTab, type DisplayUser } from '../utils';
import { UserFilter } from '../components/UserFilter';
import { UserDetailModal } from '../components/UserDetailModal';
import { TableHeader, UserRow } from '../components/UserTable';
import { Pagination } from '../components/Pagination';

const ADMIN_PAGE_SIZE = 10;

const USER_PAGE_SIZE = 10;

export default function AdminPage() {
  useDocumentTitle('Admin');
  const [mainTab, setMainTab] = useState<'users' | 'documents'>('users');
  const [adminPage, setAdminPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [userStatusTab, setUserStatusTab] = useState<UserStatusTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data, isLoading, isError } = useGetUsers({ size: 100 });
  useEffect(() => { if (isError) showToast('데이터를 불러오지 못했습니다.'); }, [isError]);
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
  const filteredUsers = allPageUsers
    .filter((u) => userStatusTab === 'all' || u.displayStatus === userStatusTab)
    .filter((u) => !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()));
  const userTotalPages = Math.max(1, Math.ceil(filteredUsers.length / USER_PAGE_SIZE));
  const pagedUsers = filteredUsers.slice((userPage - 1) * USER_PAGE_SIZE, userPage * USER_PAGE_SIZE);

  const myId = allAdmins.find((u) => u.email === myEmail)?.user_id;

  const handleApprove = (userId: string) =>
    approve(userId, { onError: (e) => showToast(getAdminMutationError(e)) });

  const handleReject = (userId: string) =>
    rejectUser(userId, { onError: (e) => showToast(getAdminMutationError(e)) });

  const handleDelete = (userId: string) =>
    deleteUser(userId, { onError: (e) => showToast(getAdminMutationError(e)) });

  const handleCopyId = (userId: string) =>
    copyText(userId)
      .then(() => showToast('ID가 복사되었습니다.', 'success'))
      .catch((e) => { logError('AdminPage.copy', e); showToast('복사에 실패했습니다.'); });

  return (
    <div className="h-full overflow-y-auto custom-scroll bg-white p-8">
      {selectedUserId && (
        <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}

      <h1 className="mars-display text-2xl font-bold text-text-primary mb-6">관리자</h1>

      <div className="flex items-center gap-1 border-b border-surface-border mb-8" role="tablist">
        {([
          { key: 'users', label: '회원 관리' },
          { key: 'documents', label: '문서 관리' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={mainTab === tab.key}
            onClick={() => setMainTab(tab.key)}
            className={`relative px-4 py-2.5 text-sm font-semibold transition-colors ${
              mainTab === tab.key
                ? 'text-brand'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {tab.label}
            {mainTab === tab.key && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-brand to-brand-light" />
            )}
          </button>
        ))}
      </div>

      {mainTab === 'documents' && <AdminDocuments />}

      {mainTab === 'users' && (<>
      <section className="mb-10">
        <h2 className="text-base font-semibold text-text-primary mb-3">관리자</h2>
        <div className="overflow-x-auto rounded-xl border border-surface-border shadow-sm overflow-hidden">
          <table className="w-full table-fixed bg-surface text-sm">
            <TableHeader />
            <tbody>
              {!isLoading && pagedAdmins.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-muted">관리자가 없습니다.</td>
                </tr>
              )}
              {isLoading
                ? [...Array(3)].map((_, i) => <AdminRowSkeleton key={i} />)
                : pagedAdmins.map((user) => (
                    <UserRow
                      key={user.user_id}
                      user={user}
                      isMutating={isMutating}
                      myId={myId}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onDelete={handleDelete}
                      onSelect={setSelectedUserId}
                      onCopyId={handleCopyId}
                    />
                  ))
              }
            </tbody>
          </table>
        </div>
        <Pagination page={adminPage} totalPages={adminTotalPages} onChange={setAdminPage} />
      </section>

      <section>
        <h2 className="text-base font-semibold text-text-primary mb-3">사용자</h2>
        <UserFilter
          status={userStatusTab}
          onStatusChange={(status) => { setUserStatusTab(status); setUserPage(1); }}
          query={searchQuery}
          onQueryChange={(query) => { setSearchQuery(query); setUserPage(1); }}
        />
        <div className="overflow-x-auto rounded-xl border border-surface-border shadow-sm overflow-hidden">
          <table className="w-full table-fixed bg-surface text-sm">
            <TableHeader />
            <tbody>
              {!isLoading && pagedUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-muted">해당하는 사용자가 없습니다.</td>
                </tr>
              )}
              {isLoading
                ? [...Array(6)].map((_, i) => <AdminRowSkeleton key={i} />)
                : pagedUsers.map((user) => (
                    <UserRow
                      key={user.user_id}
                      user={user}
                      isMutating={isMutating}
                      myId={myId}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onDelete={handleDelete}
                      onSelect={setSelectedUserId}
                      onCopyId={handleCopyId}
                    />
                  ))
              }
            </tbody>
          </table>
        </div>
        <Pagination page={userPage} totalPages={userTotalPages} onChange={setUserPage} />
      </section>
      </>)}
    </div>
  );
}
