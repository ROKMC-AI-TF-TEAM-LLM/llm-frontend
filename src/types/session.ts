export interface SessionData {
  session_id: string
  title: string
  updated_at: string
  /**
   * 즐겨찾기 여부.
   * TODO(API): 백엔드 필드명 확정 시 교체 (is_favorite / favorite / pinned 등).
   * 서버가 안 내려주면 undefined → 즐겨찾기 없음으로 취급(하위 호환).
   */
  is_favorite?: boolean
}

export interface SessionPageData {
  items: SessionData[]
  next_cursor: string | null
  has_next: boolean
}

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

// PATCH는 부분 수정이므로 각 필드를 optional로 둔다(제목만 / 즐겨찾기만 각각 전송 가능).
export interface UpdateSessionRequest {
  title?: string
  /** TODO(API): 백엔드 필드명 확정 시 교체. 즐겨찾기 토글에 사용. */
  is_favorite?: boolean
}
export type UpdateSessionErrorCode = 'UNAUTHORIZED' | 'TOKEN_INVALID' | 'SESSION_NOT_FOUND' | 'SESSION_ACCESS_DENIED' | 'VALIDATION_ERROR'
export interface UpdateSessionResponse {
  success: boolean
  status_code: number
  data: SessionData
  error: { code: UpdateSessionErrorCode; detail: string } | null
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
