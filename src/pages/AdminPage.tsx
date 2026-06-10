import { useState, useEffect, useRef } from 'react';
import { useGetUsers, useGetMe, useApproveUser, useDeleteUsers, useRejectUser, useInquiryUsers } from '../hooks/useUser';
import type { AdminUserItem } from '../types/user';
import { AdminRowSkeleton, Skeleton } from '../ui/components/Skeleton';
import Toast from '../ui/components/Toast';
import { getApiError } from '../utils/error';

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

const getAdminMutationError = (error: unknown): string =>
  getApiError(error, ADMIN_MUTATION_ERRORS, {}, '처리 중 오류가 발생했습니다.');

const ADMIN_PAGE_SIZE = 10;
const USER_PAGE_SIZE = 10;

function UserDetailModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { data, isLoading, isError } = useInquiryUsers(userId);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current(); };
    window.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('modal-open');
    };
  }, []);

  const user = data?.data?.data;

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const rows: { label: string; content: React.ReactNode }[] = user ? [
    { label: '이름',      content: <span className="text-sm text-text-secondary">{user.name}</span> },
    { label: '이메일',    content: <span className="text-sm text-text-secondary">{user.email}</span> },
    { label: '사용자 ID', content: <span className="font-mono text-xs text-text-muted break-all text-right">{user.user_id}</span> },
    { label: '역할',      content: (
      <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
        {user.role === 'admin' ? '관리자' : '사용자'}
      </span>
    )},
    { label: '상태',      content: (
      <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${STATUS_STYLE[user.status as keyof typeof STATUS_STYLE] ?? ''}`}>
        {STATUS_LABEL[user.status as keyof typeof STATUS_LABEL] ?? user.status}
      </span>
    )},
    { label: '가입일',    content: <span className="text-sm text-text-secondary">{fmt(user.created_at)}</span> },
    { label: '수정일',    content: <span className="text-sm text-text-secondary">{fmt(user.updated_at)}</span> },
  ] : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-surface-border">
          <h2 className="text-base font-semibold text-text-primary">사용자 상세 정보</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors" aria-label="닫기">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="px-6 py-5 space-y-4">
            {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
          </div>
        ) : isError ? (
          <div className="px-6 py-8 text-center text-sm text-text-muted">정보를 불러오지 못했습니다.</div>
        ) : !user ? (
          <div className="px-6 py-8 text-center text-sm text-text-muted">사용자 정보가 없습니다.</div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            {rows.map(({ label, content }) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <span className="text-xs font-medium text-text-muted shrink-0 mt-0.5">{label}</span>
                {content}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const TableHeader = () => (
  <thead>
    <tr className="border-b border-surface-border text-left text-text-muted text-xs">
      <th className="px-4 py-3 w-[13%] whitespace-nowrap">이름</th>
      <th className="px-4 py-3 w-[22%] whitespace-nowrap">이메일</th>
      <th className="px-4 py-3 w-[28%] whitespace-nowrap">사용자 ID</th>
      <th className="px-4 py-3 w-[12%] whitespace-nowrap">상태</th>
      <th className="px-4 py-3 w-[13%] whitespace-nowrap">가입일</th>
      <th className="px-4 py-3 w-[12%] whitespace-nowrap">처리</th>
    </tr>
  </thead>
);

interface UserRowProps {
  user: DisplayUser;
  isMutating: boolean;
  myId: string | undefined;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
  onDelete: (userId: string) => void;
  onSelect: (userId: string) => void;
  onCopyId: (userId: string) => void;
}

const UserRow = ({ user, isMutating, myId, onApprove, onReject, onDelete, onSelect, onCopyId }: UserRowProps) => (
  <tr
    className="border-b border-surface-border last:border-0 hover:bg-surface-card1 cursor-pointer"
    onClick={() => onSelect(user.user_id)}
  >
    <td className="px-4 py-3 font-medium text-text-primary whitespace-nowrap">{user.name}</td>
    <td className="px-4 py-3 text-text-secondary text-sm">{user.email}</td>
    <td className="px-4 py-3">
      <button
        onClick={(e) => { e.stopPropagation(); onCopyId(user.user_id); }}
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
    <td className="px-4 py-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
      {user.displayStatus === 'pending' && (
        <>
          <button
            onClick={() => onApprove(user.user_id)}
            disabled={isMutating}
            title="승인"
            className="w-6 h-6 flex items-center justify-center rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
          <button
            onClick={() => onReject(user.user_id)}
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
      {user.displayStatus === 'rejected' && (
        <button
          onClick={() => onApprove(user.user_id)}
          disabled={isMutating}
          title="승인"
          className="w-6 h-6 flex items-center justify-center rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      )}
      {(user.displayStatus === 'rejected' || user.displayStatus === 'approved' || user.displayStatus === 'admin') && (
        <button
          onClick={() => onDelete(user.user_id)}
          disabled={isMutating || user.user_id === myId}
          className="px-4 py-1 rounded bg-text-secondary text-surface text-xs hover:bg-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          삭제
        </button>
      )}
    </td>
  </tr>
);

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
    <div className="flex items-center justify-center gap-1 mt-4">
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [errorDismissed, setErrorDismissed] = useState(false);

  const { data, isLoading, isError } = useGetUsers({ size: 100 });
  useEffect(() => { if (!isError) setErrorDismissed(false); }, [isError]);
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
    approve(userId, { onError: (e) => setMutationError(getAdminMutationError(e)) });

  const handleReject = (userId: string) =>
    rejectUser(userId, { onError: (e) => setMutationError(getAdminMutationError(e)) });

  const handleDelete = (userId: string) =>
    deleteUser(userId, { onError: (e) => setMutationError(getAdminMutationError(e)) });

  const handleCopyId = (userId: string) =>
    navigator.clipboard.writeText(userId)
      .then(() => setCopiedKey((k) => k + 1))
      .catch(() => setMutationError('복사에 실패했습니다.'));

  return (
    <div className="min-h-full bg-white p-8">
      {selectedUserId && (
        <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
      {copiedKey > 0 && (
        <Toast key={copiedKey} message="ID가 복사되었습니다." type="success" onClose={() => setCopiedKey(0)} />
      )}
      {mutationError && (
        <Toast message={mutationError} type="error" onClose={() => setMutationError('')} />
      )}
      {isError && !errorDismissed && (
        <Toast message="데이터를 불러오지 못했습니다." onClose={() => setErrorDismissed(true)} />
      )}

      <h1 className="text-2xl font-bold text-text-primary mb-8">관리자 - 회원 관리</h1>

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
        <div className="flex items-center gap-3 mb-4">
          <div className="flex gap-2">
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
          <div className="relative ml-auto">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setUserPage(1); }}
              placeholder="이름 또는 이메일 검색.."
              className="pl-9 pr-4 py-1.5 text-sm rounded-full border border-surface-border bg-surface text-text-primary placeholder-text-muted focus:outline-none focus:border-brand transition-colors w-56 text-center"
            />
          </div>
        </div>
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
    </div>
  );
}
