import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  uploadAdminDocument,
  getAdminDocuments,
  deleteAdminDocument,
} from '../api/services/adminDocument'
import type { GetAdminDocumentsParams, UploadDocumentFields } from '../types/adminDocument'
import { useAuth } from '../context/AuthContext'

// 관리자 문서 목록. 처리 중(PROCESSING) 문서가 있으면 색인이 끝날 때까지 주기적으로 다시 불러온다.
export const useAdminDocuments = (params?: GetAdminDocumentsParams) => {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['admin', 'documents', params],
    queryFn: () => getAdminDocuments(params),
    enabled: !!accessToken,
    retry: 1,
    // 색인 진행 상태(PROCESSING → COMPLETED)를 반영하려고, 처리 중 문서가 하나라도 있으면 3초마다 폴링.
    refetchInterval: (query) => {
      const docs = query.state.data?.data.data.documents ?? []
      const hasProcessing = docs.some((d) => d.status === 'PROCESSING')
      return hasProcessing ? 3000 : false
    },
  })
}

export const useUploadDocument = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, fields }: { file: File; fields: UploadDocumentFields }) =>
      uploadAdminDocument(file, fields),
    onSuccess: () => {
      // 업로드 직후 목록을 갱신해 새 문서(PROCESSING)가 바로 보이게 한다.
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
