import { formatDate } from '@/shared/utils/date';
import { CheckIcon, CloseIcon } from '@/shared/components/icons';
import { STATUS_LABEL, STATUS_STYLE, type DisplayUser } from '../utils';

export const TableHeader = () => (
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

export const UserRow = ({ user, isMutating, myId, onApprove, onReject, onDelete, onSelect, onCopyId }: UserRowProps) => (
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
      {formatDate(user.created_at)}
    </td>
    <td className="px-4 py-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
      {user.displayStatus === 'pending' && (
        <>
          <button
            onClick={() => onApprove(user.user_id)}
            disabled={isMutating}
            title="승인"
            aria-label="승인"
            className="w-6 h-6 flex items-center justify-center rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
          >
            <CheckIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => onReject(user.user_id)}
            disabled={isMutating}
            title="거절"
            aria-label="거절"
            className="w-6 h-6 flex items-center justify-center rounded bg-brand text-white hover:bg-brand-hover disabled:opacity-50"
          >
            <CloseIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </>
      )}
      {user.displayStatus === 'rejected' && (
        <button
          onClick={() => onApprove(user.user_id)}
          disabled={isMutating}
          title="승인"
          aria-label="승인"
          className="w-6 h-6 flex items-center justify-center rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
        >
          <CheckIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
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
