export interface SessionData {
  session_id: string
  title: string
  updated_at: string
}

export interface SessionPageData {
  items: SessionData[]
  next_cursor: string | null
  has_next: boolean
}

// GetSessions
export interface GetSessionsParams {
  cursor?: string | null
  size?: number
}
export type GetSessionsErrorCode = 'UNAUTHORIZED' | 'TOKEN_INVALID' | 'VALIDATION_ERROR'
export interface GetSessionsResponse {
  success: boolean
  status_code: number
  data: SessionPageData
  error: { code: GetSessionsErrorCode; detail: string } | null
}

// CreateSession
export interface CreateSessionRequest {
  title?: string
}
export type CreateSessionErrorCode = 'UNAUTHORIZED' | 'TOKEN_INVALID' | 'VALIDATION_ERROR'
export interface CreateSessionResponse {
  success: boolean
  status_code: number
  data: SessionData
  error: { code: CreateSessionErrorCode; detail: string } | null
}

// UpdateSession
export interface UpdateSessionRequest {
  title: string
}
export type UpdateSessionErrorCode = 'UNAUTHORIZED' | 'TOKEN_INVALID' | 'SESSION_NOT_FOUND' | 'SESSION_ACCESS_DENIED' | 'VALIDATION_ERROR'
export interface UpdateSessionResponse {
  success: boolean
  status_code: number
  data: SessionData
  error: { code: UpdateSessionErrorCode; detail: string } | null
}

// DeleteSession
export type DeleteSessionErrorCode = 'UNAUTHORIZED' | 'TOKEN_INVALID' | 'SESSION_NOT_FOUND' | 'SESSION_ACCESS_DENIED'
export interface DeleteSessionResponse {
  success: boolean
  status_code: number
  data: null
  error: { code: DeleteSessionErrorCode; detail: string } | null
}

// SearchSessions
export interface SearchSessionsRequest {
  q: string
}
export type SearchSessionsErrorCode = 'UNAUTHORIZED' | 'TOKEN_INVALID' | 'VALIDATION_ERROR'
export interface SearchSessionsResponse {
  success: boolean
  status_code: number
  data: SessionData[]
  error: { code: SearchSessionsErrorCode; detail: string } | null
}
