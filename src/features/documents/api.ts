import { backendApi } from '@/lib/axios'
import type { GetDocumentsResponse, GetDocumentsParams } from './types'

export const getDocuments = (params?: GetDocumentsParams) =>
  backendApi.get<GetDocumentsResponse>('/api/v1/documents', { params, timeout: 30000 })