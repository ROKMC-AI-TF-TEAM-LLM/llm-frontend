import { backendApi } from '../lib/axios'
import type { GetDocumentsResponse, GetDocumentsParams, DocumentItem } from '../../types/document'

export const pickDocuments = (data: unknown): DocumentItem[] => {
  if (Array.isArray(data)) return data as DocumentItem[]
  const d = data as { items?: DocumentItem[]; documents?: DocumentItem[] } | null | undefined
  return d?.items ?? d?.documents ?? []
}

export const getDocuments = (params?: GetDocumentsParams) =>
  backendApi.get<GetDocumentsResponse>('/api/v1/documents', { params, timeout: 30000 })