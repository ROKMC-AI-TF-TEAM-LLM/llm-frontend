import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  uploadAdminDocument,
  getAdminDocuments,
  getAdminDocumentStatus,
  deleteAdminDocument,
} from '../api/services/adminDocument'
import type { GetAdminDocumentsParams, UploadDocumentFields } from '../types/adminDocument'
import { normalizeDocStatus } from '../utils/document'
import { useAuth } from '../context/AuthContext'

export const useAdminDocuments = (params?: GetAdminDocumentsParams) => {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['admin', 'documents', params],
    queryFn: () => getAdminDocuments(params),
    enabled: !!accessToken,
    retry: 1,
    refetchInterval: (query) => {
      if (query.state.status === 'error') return false
      const docs = query.state.data?.data.data.documents ?? []
      const hasProcessing = docs.some((d) => normalizeDocStatus(d.status) === 'processing')
      return hasProcessing ? 5000 : false
    },
  })
}

export const useUploadDocument = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, fields }: { file: File; fields: UploadDocumentFields }) =>
      uploadAdminDocument(file, fields),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'documents'] })
    },
  })
}

export const useDeleteDocument = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (documentId: string) => deleteAdminDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'documents'] })
    },
  })
}

export const useAdminDocumentStatus = (documentId: string | undefined) => {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['admin', 'document-status', documentId],
    queryFn: () => getAdminDocumentStatus(documentId!),
    enabled: !!accessToken && !!documentId,
    retry: 1,
    refetchInterval: (query) => {
      if (query.state.status === 'error') return false
      const status = query.state.data?.data.data.status
      return normalizeDocStatus(status) === 'processing' ? 5000 : false
    },
  })
}
