import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'
import {
  uploadAdminDocument,
  getAdminDocuments,
  getAdminDocumentStatus,
  deleteAdminDocument,
  retryAdminDocument,
} from './api'
import type { GetAdminDocumentsParams, UploadDocumentFields } from './types'
import { normalizeDocStatus } from '@/features/documents/utils'
import { useAuth } from '@/features/auth/useAuth'
import { nextOffset } from '@/shared/utils/pagination'

const ADMIN_DOC_LIMIT = 20

export const useInfiniteAdminDocuments = (
  params?: Omit<GetAdminDocumentsParams, 'offset' | 'limit'>,
) => {
  const { accessToken } = useAuth()
  return useInfiniteQuery({
    queryKey: ['admin', 'documents', params ?? {}],
    queryFn: ({ pageParam }) =>
      getAdminDocuments({
        ...params,
        offset: pageParam,
        limit: ADMIN_DOC_LIMIT,
      }),
    initialPageParam: 0,
    getNextPageParam: nextOffset(
      (d: { documents: unknown[]; has_more?: boolean }) => d.documents,
    ),
    enabled: !!accessToken,
    retry: 1,
    placeholderData: keepPreviousData,
    refetchInterval: (query) => {
      if (query.state.status === 'error') return false
      const pages = query.state.data?.pages ?? []
      const hasProcessing = pages.some((p) =>
        p.data.data.documents.some(
          (d) => normalizeDocStatus(d.status) === 'processing',
        ),
      )
      return hasProcessing ? 5000 : false
    },
  })
}

export const useUploadDocument = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      file,
      fields,
    }: {
      file: File
      fields: UploadDocumentFields
    }) => uploadAdminDocument(file, fields),
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

export const useRetryDocument = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (documentId: string) => retryAdminDocument(documentId),
    onSuccess: (_res, documentId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'documents'] })
      // 행은 상태 조회 캐시를 목록보다 우선하므로, 이전 폴링에서 남은 실패 상태를 비운다.
      queryClient.invalidateQueries({
        queryKey: ['admin', 'document-status', documentId],
      })
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
