export interface ProjectData {
  project_id: string
  title: string
  is_favorite: boolean
  instructions: string
}

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

export interface UpdateProjectRequest {
  title: string
}
export type UpdateProjectErrorCode = ProjectMutationErrorCode
export type UpdateProjectResponse = ProjectMutationResponse

export interface SetProjectFavoriteRequest {
  is_favorite: boolean
}
export type SetProjectFavoriteResponse = ProjectMutationResponse

export type ProjectLlmMutationErrorCode = ProjectMutationErrorCode | 'CONFLICT' | 'LLM_SERVER_ERROR'

export interface SetProjectInstructionRequest {
  instructions: string | null
}
export interface SetProjectInstructionResponse {
  success: boolean
  status_code: number
  data: ProjectData
  error: { code: ProjectLlmMutationErrorCode; detail: string } | null
}

export interface DeleteProjectResponse {
  success: boolean
  status_code: number
  data: null
  error: { code: ProjectLlmMutationErrorCode; detail: string } | null
}

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
