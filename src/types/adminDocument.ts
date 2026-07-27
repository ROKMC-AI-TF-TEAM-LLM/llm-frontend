// 관리자 문서 관리 API 타입.
// 업로드(POST) / 목록(GET) / 상태(GET) / 삭제(DELETE) 4개 엔드포인트.

// 색인 처리 상태. 서버가 문자열로 주므로 알려진 값 + 그 외를 허용한다.
export type AdminDocStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED' | (string & {})

// 공개 범위. ALL = 전체 공개, DEPT_ONLY = 소유 부서만.
export type DocVisibility = 'ALL' | 'DEPT_ONLY'

// ─── 업로드: POST /api/v1/admin/documents (multipart/form-data) ───
// file, name, domain은 필수. visibility 미지정 시 서버 기본값. department는 DEPT_ONLY일 때만.
export interface UploadDocumentFields {
  name: string
  domain: string
  visibility?: DocVisibility
  department?: string | null
}

export interface UploadDocumentData {
  document_id: string
  name: string
  domain: string
  visibility: string
  status: AdminDocStatus
  created_at: string
}

export type UploadDocumentErrorCode =
  | 'UNAUTHORIZED' | 'ADMIN_REQUIRED' | 'VALIDATION_ERROR' | 'LLM_SERVER_ERROR'

export interface UploadDocumentResponse {
  success: boolean
  status_code: number
  data: UploadDocumentData
  error: { code: UploadDocumentErrorCode; detail: string } | null
}

// ─── 목록: GET /api/v1/admin/documents ───
export interface AdminDocumentItem {
  document_id: string
  name: string
  content_type: string
  domain: string
  visibility: string
  department: string | null
  status: AdminDocStatus
  created_at: string
  size: number
}

export interface AdminDocumentListData {
  documents: AdminDocumentItem[]
  total: number
  offset: number
  limit: number
  has_more: boolean
}

export interface GetAdminDocumentsParams {
  offset?: number
  limit?: number
  domain?: string
  search?: string
}

export type GetAdminDocumentsErrorCode = 'UNAUTHORIZED' | 'ADMIN_REQUIRED' | 'VALIDATION_ERROR'

export interface GetAdminDocumentsResponse {
  success: boolean
  status_code: number
  data: AdminDocumentListData
  error: { code: GetAdminDocumentsErrorCode; detail: string } | null
}

// ─── 상태: GET /api/v1/admin/documents/{id}/status ───
export interface DocumentStatusData {
  document_id: string
  status: AdminDocStatus
  chunks_indexed: number
  error?: string | null
}

export type GetDocumentStatusErrorCode =
  | 'UNAUTHORIZED' | 'ADMIN_REQUIRED' | 'DOCUMENT_NOT_FOUND'

export interface GetDocumentStatusResponse {
  success: boolean
  status_code: number
  data: DocumentStatusData
  error: { code: GetDocumentStatusErrorCode; detail: string } | null
}

// ─── 삭제: DELETE /api/v1/admin/documents/{id} ───
export interface DeleteDocumentData {
  document_id: string
  deleted_chunks: number
}

export type DeleteDocumentErrorCode =
  | 'UNAUTHORIZED' | 'ADMIN_REQUIRED' | 'DOCUMENT_NOT_FOUND'

export interface DeleteDocumentResponse {
  success: boolean
  status_code: number
  data: DeleteDocumentData
  error: { code: DeleteDocumentErrorCode; detail: string } | null
}
