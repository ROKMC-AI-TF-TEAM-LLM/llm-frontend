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

// 관리자 문서 목록. 처리 중(PROCESSING) 문서가 있으면 색인이 끝날 때까지 주기적으로 다시 불러온다.
export const useAdminDocuments = (params?: GetAdminDocumentsParams) => {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['admin', 'documents', params],
    queryFn: () => getAdminDocuments(params),
    enabled: !!accessToken,
    retry: 1,
    // 색인 진행 상태(PROCESSING → COMPLETED) 폴링 — useServerStatus의 헬스체크와 같은 조건부 방식.
    // - 문서별 status API를 개별 호출하지 않고, 목록 1회 호출로 처리 중 문서 전체를 한 번에 갱신(배치).
    // - 처리 중 문서가 하나도 없으면 폴링 자체를 멈춘다(완료된 문서에는 호출 없음).
    // - 요청이 실패한 상태면 멈춘다(장애 난 서버에 5초마다 계속 쏘는 것 방지).
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

// 개별 문서 색인 상태 검증. processing인 동안만 폴링, 완료/실패면 멈춘다.
export const useAdminDocumentStatus = (documentId: string | undefined) => {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['admin', 'document-status', documentId],
    queryFn: () => getAdminDocumentStatus(documentId!),
    enabled: !!accessToken && !!documentId,
    retry: 1,   // ← 목록 훅과 동일하게. 404 검증 실패 시 과도한 재시도 방지
    refetchInterval: (query) => {
      if (query.state.status === 'error') return false
      const status = query.state.data?.data.data.status
      return normalizeDocStatus(status) === 'processing' ? 5000 : false
    },
  })
}
