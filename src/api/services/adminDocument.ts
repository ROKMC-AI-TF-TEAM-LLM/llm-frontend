import { backendApi } from '../lib/axios'
import type {
  UploadDocumentFields,
  UploadDocumentResponse,
  GetAdminDocumentsParams,
  GetAdminDocumentsResponse,
  GetDocumentStatusResponse,
  DeleteDocumentResponse,
} from '../../types/adminDocument'

// 업로드: multipart/form-data. file + 메타 필드를 FormData로 싣는다.
// Content-Type을 undefined로 두면 axios가 boundary 포함한 multipart 헤더를 자동 설정한다.
export const uploadAdminDocument = (file: File, fields: UploadDocumentFields) => {
  const form = new FormData()
  form.append('file', file)
  form.append('name', fields.name)
  form.append('domain', fields.domain)
  if (fields.visibility) form.append('visibility', fields.visibility)
  if (fields.department) form.append('department', fields.department)

  return backendApi.post<UploadDocumentResponse>('/api/v1/admin/documents', form, {
    headers: { 'Content-Type': undefined },
    // 색인은 백그라운드라 즉시 202를 주지만, 업로드 자체(파일 전송)는 오래 걸릴 수 있어 타임아웃을 넉넉히.
    timeout: 120000,
  })
}

export const getAdminDocuments = (params?: GetAdminDocumentsParams) =>
  backendApi.get<GetAdminDocumentsResponse>('/api/v1/admin/documents', { params, timeout: 30000 })

export const getAdminDocumentStatus = (documentId: string) =>
  backendApi.get<GetDocumentStatusResponse>(`/api/v1/admin/documents/${documentId}/status`)

export const deleteAdminDocument = (documentId: string) =>
  backendApi.delete<DeleteDocumentResponse>(`/api/v1/admin/documents/${documentId}`)
