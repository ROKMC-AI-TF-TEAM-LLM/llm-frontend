import { backendApi } from '../lib/axios'
import type { GetDocumentsResponse, GetDocumentsParams } from '../../types/document'

export const getDocuments = (params?: GetDocumentsParams) =>
  backendApi.get<GetDocumentsResponse>('/api/v1/documents', { params })
