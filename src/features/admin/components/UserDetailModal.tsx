import { useInquiryUsers } from '@/features/users/hooks'
import { Skeleton } from '@/shared/components/Skeleton'
import { formatDateTimeLong } from '@/shared/utils/date'
import Modal from '@/shared/components/Modal'
import { CloseIcon } from '@/shared/components/icons'
import { STATUS_LABEL, STATUS_STYLE } from '../utils'
import IconButton from '@/shared/components/IconButton'

export function UserDetailModal({
  userId,
  onClose,
}: {
  userId: string
  onClose: () => void
}) {
  const { data, isLoading, isError } = useInquiryUsers(userId)
  const user = data?.data?.data

  const rows: { label: string; content: React.ReactNode }[] = user
    ? [
        {
          label: '이름',
          content: (
            <span className="text-sm text-text-secondary">{user.name}</span>
          ),
        },
        {
          label: '이메일',
          content: (
            <span className="text-sm text-text-secondary">{user.email}</span>
          ),
        },
        {
          label: '사용자 ID',
          content: (
            <span className="font-mono text-xs text-text-muted break-all text-right">
              {user.user_id}
            </span>
          ),
        },
        {
          label: '역할',
          content: (
            <span
              className={`text-11 font-medium px-2.5 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}
            >
              {user.role === 'admin' ? '관리자' : '사용자'}
            </span>
          ),
        },
        {
          label: '상태',
          content: (
            <span
              className={`text-11 font-medium px-2.5 py-0.5 rounded-full ${STATUS_STYLE[user.status as keyof typeof STATUS_STYLE] ?? ''}`}
            >
              {STATUS_LABEL[user.status as keyof typeof STATUS_LABEL] ??
                user.status}
            </span>
          ),
        },
        {
          label: '가입일',
          content: (
            <span className="text-sm text-text-secondary">
              {formatDateTimeLong(user.created_at)}
            </span>
          ),
        },
        {
          label: '수정일',
          content: (
            <span className="text-sm text-text-secondary">
              {formatDateTimeLong(user.updated_at)}
            </span>
          ),
        },
      ]
    : []

  return (
    <Modal
      onClose={onClose}
      backdrop="blur"
      className="bg-surface rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-5 border-b border-surface-border">
        <h2 className="text-base font-semibold text-text-primary">
          사용자 상세 정보
        </h2>
        <IconButton onClick={onClose} label="닫기">
          <CloseIcon className="w-5 h-5" />
        </IconButton>
      </div>

      {isLoading ? (
        <div className="px-6 py-5 space-y-4">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="px-6 py-8 text-center text-sm text-text-muted">
          정보를 불러오지 못했습니다.
        </div>
      ) : !user ? (
        <div className="px-6 py-8 text-center text-sm text-text-muted">
          사용자 정보가 없습니다.
        </div>
      ) : (
        <div className="px-6 py-5 space-y-4">
          {rows.map(({ label, content }) => (
            <div key={label} className="flex items-start justify-between gap-4">
              <span className="text-xs font-medium text-text-muted shrink-0 mt-0.5">
                {label}
              </span>
              {content}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
