export type AdminDocStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED' | (string & {})

export type DocVisibility = 'ALL' | 'DEPT_ONLY'

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
