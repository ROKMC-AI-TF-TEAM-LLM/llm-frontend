export type UserStatus = 'pending' | 'approved' | 'rejected'
export type UserRole = 'admin' | 'user'

export interface UserData {
  user_id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  created_at: string
  updated_at: string
}

export interface AdminUserItem {
  user_id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  created_at: string
}

export interface AdminUserPageData {
  items: AdminUserItem[]
  next_cursor: string | null
  has_next: boolean
}

export type GetMeErrorCode = 'UNAUTHORIZED' | 'TOKEN_INVALID'
export interface GetMe {
  name: string
  email: string
  role: UserRole
  created_at: string
}
export interface GetMeResponse {
  success: boolean
  status_code: number
  data: GetMe
  error: { code: GetMeErrorCode; detail: string } | null
}

export interface GetAdminUsersParams {
  role?: UserRole
  status?: UserStatus
  search?: string
  cursor?: string | null
  size?: number
}
export type AdminUsersErrorCode = 'UNAUTHORIZED' | 'TOKEN_INVALID' | 'ADMIN_REQUIRED' | 'VALIDATION_ERROR'
export interface AdminUsersResponse {
  success: boolean
  status_code: number
  data: AdminUserPageData
  error: { code: AdminUsersErrorCode; detail: string } | null
}

export type AdminUserInquiryErrorCode = 'UNAUTHORIZED' | 'TOKEN_INVALID' | 'ADMIN_REQUIRED' | 'USER_NOT_FOUND'
export interface AdminUserInquiryResponse {
  success: boolean
  status_code: number
  data: UserData
  error: { code: AdminUserInquiryErrorCode; detail: string } | null
}

export type AdminUserDeleteErrorCode = 'UNAUTHORIZED' | 'TOKEN_INVALID' | 'ADMIN_REQUIRED' | 'USER_NOT_FOUND'
export interface AdminUserDeleteResponse {
  success: boolean
  status_code: number
  data: null
  error: { code: AdminUserDeleteErrorCode; detail: string } | null
}

export type AdminUserApproveErrorCode = 'UNAUTHORIZED' | 'TOKEN_INVALID' | 'ADMIN_REQUIRED' | 'USER_NOT_FOUND'
export interface AdminUserApproveResponse {
  success: boolean
  status_code: number
  data: UserData
  error: { code: AdminUserApproveErrorCode; detail: string } | null
}

export type AdminUserRejectErrorCode = 'UNAUTHORIZED' | 'TOKEN_INVALID' | 'ADMIN_REQUIRED' | 'USER_NOT_FOUND'
export interface AdminUserRejectResponse {
  success: boolean
  status_code: number
  data: UserData
  error: { code: AdminUserRejectErrorCode; detail: string } | null
}
