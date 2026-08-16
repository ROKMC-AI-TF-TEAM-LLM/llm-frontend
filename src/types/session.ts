export interface SessionData {
  session_id: string
  title: string
  updated_at: string
  is_favorite?: boolean
  project_id?: string | null
}

export interface SessionPageData {
  items: SessionData[]
  next_cursor: string | null
  has_next: boolean
}

export interface GetSessionsParams {
  cursor?: string | null
  size?: number
  is_favorite?: boolean
}
export type GetSessionsErrorCode = 'UNAUTHORIZED' | 'TOKEN_INVALID' | 'VALIDATION_ERROR'
export interface GetSessionsResponse {
  success: boolean
  status_code: number
  data: SessionPageData
  error: { code: GetSessionsErrorCode; detail: string } | null
}

export interface CreateSessionRequest {
  title?: string
  project_id?: string
}
export type CreateSessionErrorCode = 'UNAUTHORIZED' | 'TOKEN_INVALID' | 'PROJECT_ACCESS_DENIED' | 'PROJECT_NOT_FOUND' | 'VALIDATION_ERROR'
export interface CreateSessionResponse {
  success: boolean
  status_code: number
  data: SessionData
  error: { code: CreateSessionErrorCode; detail: string } | null
}

export interface UpdateSessionRequest {
  title?: string
}
export type UpdateSessionErrorCode = 'UNAUTHORIZED' | 'TOKEN_INVALID' | 'SESSION_NOT_FOUND' | 'SESSION_ACCESS_DENIED' | 'VALIDATION_ERROR'
export interface UpdateSessionResponse {
  success: boolean
  status_code: number
  data: SessionData
  error: { code: UpdateSessionErrorCode; detail: string } | null
}

export interface SetFavoriteRequest {
  is_favorite: boolean
}
export type SetFavoriteErrorCode =
  | 'UNAUTHORIZED'
  | 'SESSION_ACCESS_DENIED'
  | 'SESSION_NOT_FOUND'
  | 'VALIDATION_ERROR'
export interface SetFavoriteResponse {
  success: boolean
  status_code: number
  data: SessionData
  error: { code: SetFavoriteErrorCode; detail: string } | null
}

export type DeleteSessionErrorCode = 'UNAUTHORIZED' | 'TOKEN_INVALID' | 'SESSION_NOT_FOUND' | 'SESSION_ACCESS_DENIED'
export interface DeleteSessionResponse {
  success: boolean
  status_code: number
  data: null
  error: { code: DeleteSessionErrorCode; detail: string } | null
}

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
