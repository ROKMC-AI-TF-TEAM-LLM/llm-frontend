export interface SessionData {
  session_id: string
  title: string
  updated_at: string
  /**
   * 즐겨찾기 여부. (PATCH /sessions/{id}/favorite 응답에 포함)
   * 목록 API가 아직 안 내려줄 수 있어 optional — undefined면 즐겨찾기 없음으로 취급(하위 호환).
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

// PATCH는 부분 수정. 즐겨찾기는 전용 엔드포인트(/favorite)를 쓰므로 여기엔 포함하지 않는다.
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

/**
 * 세션 즐겨찾기 설정 — PATCH /api/v1/sessions/{session_id}/favorite
 * 본인의 세션만 설정 가능. 즐겨찾기 변경은 목록 정렬 기준(updated_at)에 영향을 주지 않는다.
 */
export interface SetFavoriteRequest {
  is_favorite: boolean
}
export type SetFavoriteErrorCode =
  | 'UNAUTHORIZED'          // 401 인증 실패
  | 'SESSION_ACCESS_DENIED' // 403 세션 접근 거부
  | 'SESSION_NOT_FOUND'     // 404 세션 없음
  | 'VALIDATION_ERROR'      // 422 요청 유효성 오류
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
