// 프로젝트 워크스페이스 API 타입 (스웨거 기준).
// 서버가 주는 필드는 project_id / title / is_favorite / instructions 4개다.
// (파일·대화·도메인 등 화면에만 있는 값은 프론트 목업/로컬 상태로 유지한다)

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
// 목록 응답의 항목은 instructions 없이 요약만 온다(project_id/title/is_favorite).
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

// 프로젝트 관련 뮤테이션은 에러코드가 동일하다(401/403/404/422).
export type ProjectMutationErrorCode =
  | 'UNAUTHORIZED'
  | 'PROJECT_ACCESS_DENIED'
  | 'PROJECT_NOT_FOUND'
  | 'VALIDATION_ERROR'

// 뮤테이션 공통 응답(성공 시 갱신된 ProjectData).
export interface ProjectMutationResponse {
  success: boolean
  status_code: number
  data: ProjectData
  error: { code: ProjectMutationErrorCode; detail: string } | null
}

// ── 제목 수정: PATCH /api/v1/projects/{project_id} ──
// 요청 body는 title만 받는다.
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
// null 또는 빈 문자열을 보내면 지침이 삭제된다.
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
