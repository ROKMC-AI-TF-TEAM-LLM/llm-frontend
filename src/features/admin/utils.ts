import type { AdminUserItem } from '@/features/users/types'
import { getApiError } from '@/shared/utils/error'

export type DisplayStatus = 'admin' | 'pending' | 'approved' | 'rejected'

export type UserStatusTab = 'all' | 'pending' | 'approved' | 'rejected'

export interface DisplayUser extends AdminUserItem {
  displayStatus: DisplayStatus
}

export const STATUS_LABEL: Record<DisplayStatus, string> = {
  admin: '관리자',
  pending: '대기 중',
  approved: '승인됨',
  rejected: '거절됨',
}

export const STATUS_STYLE: Record<DisplayStatus, string> = {
  admin: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-brand-subtle text-brand',
}

export const USER_TABS: { label: string; value: UserStatusTab }[] = [
  { label: '전체', value: 'all' },
  { label: '대기 중', value: 'pending' },
  { label: '승인됨', value: 'approved' },
  { label: '거절됨', value: 'rejected' },
]

const ADMIN_MUTATION_ERRORS: Record<string, string> = {
  ADMIN_REQUIRED: '관리자 권한이 필요합니다.',
  USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
  UNAUTHORIZED: '인증이 만료되었습니다. 다시 로그인해주세요.',
}

export const getAdminMutationError = (error: unknown): string =>
  getApiError(error, ADMIN_MUTATION_ERRORS, {}, '처리 중 오류가 발생했습니다.')
