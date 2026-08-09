import { backendApi } from '../lib/axios'
import type {
  UploadDocumentFields,
  UploadDocumentResponse,
  GetAdminDocumentsParams,
  GetAdminDocumentsResponse,
  GetDocumentStatusResponse,
  DeleteDocumentResponse,
} from '../../types/adminDocument'

export const uploadAdminDocument = (file: File, fields: UploadDocumentFields) => {
  const form = new FormData()
  form.append('file', file)
  form.append('name', fields.name)
  form.append('domain', fields.domain)
  if (fields.visibility) form.append('visibility', fields.visibility)
  if (fields.department) form.append('department', fields.department)

  return backendApi.post<UploadDocumentResponse>('/api/v1/admin/documents', form, {
    headers: { 'Content-Type': undefined },
    timeout: 120000,
  })
}

export const getAdminDocuments = (params?: GetAdminDocumentsParams) =>
  backendApi.get<GetAdminDocumentsResponse>('/api/v1/admin/documents', { params, timeout: 30000 })

export const getAdminDocumentStatus = (documentId: string) =>
  backendApi.get<GetDocumentStatusResponse>(`/api/v1/admin/documents/${documentId}/status`)

export const deleteAdminDocument = (documentId: string) =>
  backendApi.delete<DeleteDocumentResponse>(`/api/v1/admin/documents/${documentId}`)
