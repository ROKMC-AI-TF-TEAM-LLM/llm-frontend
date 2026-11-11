import { formatDate } from '@/shared/utils/date'
import { STATUS_LABEL, STATUS_STYLE, type DisplayUser } from '../utils'
import Button from '@/shared/components/Button'

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
)

interface UserRowProps {
  user: DisplayUser
  isMutating: boolean
  myId: string | undefined
  onApprove: (userId: string) => void
  onReject: (userId: string) => void
  onDelete: (userId: string) => void
  onSelect: (userId: string) => void
  onCopyId: (userId: string) => void
}

export const UserRow = ({
  user,
  isMutating,
  myId,
  onApprove,
  onReject,
  onDelete,
  onSelect,
  onCopyId,
}: UserRowProps) => (
  <tr
    className="border-b border-surface-border last:border-0 hover:bg-surface-card1 cursor-pointer"
    onClick={() => onSelect(user.user_id)}
  >
    <td className="px-4 py-3 font-medium text-text-primary whitespace-nowrap">
      {user.name}
    </td>
    <td className="px-4 py-3 text-text-secondary text-sm">{user.email}</td>
    <td className="px-4 py-3">
      <button
        onClick={(e) => {
          e.stopPropagation()
          onCopyId(user.user_id)
        }}
        title="클릭하여 복사"
        className="font-mono text-xs text-text-muted hover:text-text-primary hover:bg-surface-subtle px-2 py-0.5 rounded transition-colors"
      >
        {user.user_id}
      </button>
    </td>
    <td className="px-4 py-3">
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[user.displayStatus]}`}
      >
        {STATUS_LABEL[user.displayStatus]}
      </span>
    </td>
    <td className="px-4 py-3 text-text-muted">{formatDate(user.created_at)}</td>
    <td className="px-4 py-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
      {user.displayStatus === 'pending' && (
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onApprove(user.user_id)}
            disabled={isMutating}
          >
            승인
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onReject(user.user_id)}
            disabled={isMutating}
          >
            거절
          </Button>
        </>
      )}
      {user.displayStatus === 'rejected' && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onApprove(user.user_id)}
          disabled={isMutating}
        >
          승인
        </Button>
      )}
      {(user.displayStatus === 'rejected' ||
        user.displayStatus === 'approved' ||
        user.displayStatus === 'admin') && (
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(user.user_id)}
          disabled={isMutating || user.user_id === myId}
        >
          삭제
        </Button>
      )}
    </td>
  </tr>
)
