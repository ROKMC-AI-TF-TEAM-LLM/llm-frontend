
export interface ProjectData {
  project_id: string
  title: string
  is_favorite: boolean
  instructions: string
}

// ── 생성: POST /api/v1/projects ──
export interface CreateProjectRequest {
  title: string
  instructions: string
}
export type CreateProjectErrorCode = 'UNAUTHORIZED' | 'VALIDATION_ERROR'
export interface CreateProjectResponse {
  success: boolean
  status_code: number
  data: ProjectData
  error: { code: CreateProjectErrorCode; detail: string } | null
}

// ── 목록: GET /api/v1/projects (커서 페이지네이션) ──
export type ProjectListItem = Omit<ProjectData, 'instructions'>
export interface ProjectListData {
  items: ProjectListItem[]
  next_cursor: string | null
  has_next: boolean
}
export interface GetProjectsParams {
  cursor?: string | null
  size?: number
  is_favorite?: boolean
}
export type GetProjectsErrorCode = 'UNAUTHORIZED' | 'VALIDATION_ERROR'
export interface GetProjectsResponse {
  success: boolean
  status_code: number
  data: ProjectListData
  error: { code: GetProjectsErrorCode; detail: string } | null
}

// ── 상세: GET /api/v1/projects/{project_id} ──
export type GetProjectErrorCode =
  | 'UNAUTHORIZED'
  | 'PROJECT_ACCESS_DENIED'
  | 'PROJECT_NOT_FOUND'
  | 'VALIDATION_ERROR'
export interface GetProjectResponse {
  success: boolean
  status_code: number
  data: ProjectData
  error: { code: GetProjectErrorCode; detail: string } | null
}

export type ProjectMutationErrorCode =
  | 'UNAUTHORIZED'
  | 'PROJECT_ACCESS_DENIED'
  | 'PROJECT_NOT_FOUND'
  | 'VALIDATION_ERROR'

export interface ProjectMutationResponse {
  success: boolean
  status_code: number
  data: ProjectData
  error: { code: ProjectMutationErrorCode; detail: string } | null
}

// ── 제목 수정: PATCH /api/v1/projects/{project_id} ──
export interface UpdateProjectRequest {
  title: string
}
export type UpdateProjectErrorCode = ProjectMutationErrorCode
export type UpdateProjectResponse = ProjectMutationResponse

// ── 즐겨찾기 설정: PATCH /api/v1/projects/{project_id}/favorite ──
export interface SetProjectFavoriteRequest {
  is_favorite: boolean
}
export type SetProjectFavoriteResponse = ProjectMutationResponse

export type ProjectLlmMutationErrorCode = ProjectMutationErrorCode | 'CONFLICT' | 'LLM_SERVER_ERROR'

// ── 지침 설정/수정: PATCH /api/v1/projects/{project_id}/instruction ──
export interface SetProjectInstructionRequest {
  instructions: string | null
}
export interface SetProjectInstructionResponse {
  success: boolean
  status_code: number
  data: ProjectData
  error: { code: ProjectLlmMutationErrorCode; detail: string } | null
}

// ── 삭제: DELETE /api/v1/projects/{project_id} ──
export interface DeleteProjectResponse {
  success: boolean
  status_code: number
  data: null
  error: { code: ProjectLlmMutationErrorCode; detail: string } | null
}

// ── 하위 대화 세션 목록: GET /api/v1/projects/{project_id}/sessions (커서) ──
export interface ProjectSessionItem {
  session_id: string
  project_id: string
  title: string
  is_favorite: boolean
  updated_at: string
}
export interface ProjectSessionsData {
  items: ProjectSessionItem[]
  next_cursor: string | null
  has_next: boolean
}
export interface GetProjectSessionsParams {
  cursor?: string | null
  size?: number
}
export interface GetProjectSessionsResponse {
  success: boolean
  status_code: number
  data: ProjectSessionsData
  error: { code: ProjectMutationErrorCode; detail: string } | null
}

export type ProjectDocStatus = 'not_indexed' | 'pending' | 'queued' | 'running' | 'done' | 'error'

export interface ProjectDocument {
  document_id: string
  name: string
  content_type: string
  size: number
  status: ProjectDocStatus | string
  created_at: string
}

// ── 참고 파일 업로드: POST /api/v1/projects/{project_id}/documents (multipart, 202) ──
export type UploadProjectDocumentErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'PROJECT_ACCESS_DENIED'
  | 'PROJECT_NOT_FOUND'
  | 'FILE_TOO_LARGE'
  | 'CONFLICT'
  | 'LLM_SERVER_ERROR'
  | 'VALIDATION_ERROR'
export interface UploadProjectDocumentResponse {
  success: boolean
  status_code: number
  data: ProjectDocument
  error: { code: UploadProjectDocumentErrorCode; detail: string } | null
}

// ── 참고 파일 목록: GET /api/v1/projects/{project_id}/documents (offset 기반) ──
export interface GetProjectDocumentsParams {
  offset?: number
  limit?: number
}
export interface ProjectDocumentsData {
  documents: ProjectDocument[]
  total: number
  offset: number
  limit: number
  has_more: boolean
}
export interface GetProjectDocumentsResponse {
  success: boolean
  status_code: number
  data: ProjectDocumentsData
  error: { code: ProjectMutationErrorCode; detail: string } | null
}

// ── 색인 상태 조회: GET /api/v1/projects/{project_id}/documents/{document_id}/status ──
export interface ProjectDocumentStatus {
  document_id: string
  status: ProjectDocStatus | string
  chunks_indexed: number
  error: string | null
}
export type ProjectDocumentStatusErrorCode =
  | 'UNAUTHORIZED'
  | 'PROJECT_ACCESS_DENIED'
  | 'DOCUMENT_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'LLM_SERVER_ERROR'
export interface GetProjectDocumentStatusResponse {
  success: boolean
  status_code: number
  data: ProjectDocumentStatus
  error: { code: ProjectDocumentStatusErrorCode; detail: string } | null
}

// ── 색인 재시도: POST /api/v1/projects/{project_id}/documents/{document_id}/retry ──
export type RetryProjectDocumentErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'PROJECT_ACCESS_DENIED'
  | 'DOCUMENT_NOT_FOUND'
  | 'CONFLICT'
  | 'FILE_TOO_LARGE'
  | 'VALIDATION_ERROR'
  | 'LLM_SERVER_ERROR'
export interface RetryProjectDocumentResponse {
  success: boolean
  status_code: number
  data: ProjectDocumentStatus
  error: { code: RetryProjectDocumentErrorCode; detail: string } | null
}

// ── 참고 파일 삭제: DELETE /api/v1/projects/{project_id}/documents/{document_id} ──
export type DeleteProjectDocumentErrorCode =
  | 'UNAUTHORIZED'
  | 'PROJECT_ACCESS_DENIED'
  | 'DOCUMENT_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'LLM_SERVER_ERROR'
export interface DeleteProjectDocumentResponse {
  success: boolean
  status_code: number
  data: null
  error: { code: DeleteProjectDocumentErrorCode; detail: string } | null
}
