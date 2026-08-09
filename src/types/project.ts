
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

// ── 지침 설정/수정: PATCH /api/v1/projects/{project_id}/instruction ──
export interface SetProjectInstructionRequest {
  instructions: string | null
}
export type SetProjectInstructionResponse = ProjectMutationResponse

// ── 하위 대화 세션 목록: GET /api/v1/projects/{project_id}/sessions (커서) ──
export interface ProjectSessionItem {
  session_id: string
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
