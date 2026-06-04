export interface TokenData {
  access_token: string
  refresh_token: string
  token_type: string
}

// Signup
export interface SignupRequest {
  name: string
  email: string
  password: string
}
export type SignupErrorCode = 'EMAIL_ALREADY_EXISTS' | 'VALIDATION_ERROR'
export interface SignupResponse {
  success: boolean
  status_code: number
  data: null
  error: { code: SignupErrorCode; detail: string } | null
}

// Login
export interface LoginRequest {
  email: string
  password: string
}
export type LoginErrorCode = 'INVALID_CREDENTIALS' | 'APPROVAL_PENDING' | 'APPROVAL_REJECTED' | 'VALIDATION_ERROR'
export interface LoginResponse {
  success: boolean
  status_code: number
  data: TokenData
  error: { code: LoginErrorCode; detail: string } | null
}

// Refresh
export interface RefreshRequest {
  refresh_token: string
}
export type RefreshErrorCode = 'TOKEN_INVALID' | 'VALIDATION_ERROR'
export interface RefreshResponse {
  success: boolean
  status_code: number
  data: TokenData
  error: { code: RefreshErrorCode; detail: string } | null
}

// Logout
export interface LogoutRequest {
  refresh_token: string
}
export type LogoutErrorCode = 'TOKEN_INVALID' | 'VALIDATION_ERROR'
export interface LogoutResponse {
  success: boolean
  status_code: number
  data: null
  error: { code: LogoutErrorCode; detail: string } | null
}
