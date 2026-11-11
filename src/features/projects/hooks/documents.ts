// 프로젝트 참고 파일(문서)의 React Query 훅: 목록, 올리기, 지우기, 다시 처리, 처리 상태 확인
import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosResponse } from 'axios'
import {
  uploadProjectDocument,
  getProjectDocuments,
  getProjectDocumentStatus,
  deleteProjectDocument,
  retryProjectDocument,
} from '../api'
import type {
  GetProjectDocumentStatusResponse,
  GetProjectDocumentsResponse,
} from '../types'
import { useAuth } from '@/features/auth/useAuth'
import { showToast } from '@/shared/store/toastStore'
import { describeApiError, readApiError } from '@/shared/utils/error'
import { projectDocumentsKey, projectDocumentStatusKey } from './cache'

const UPLOAD_ERRORS: Record<string, string> = {
  FILE_TOO_LARGE: '파일이 너무 커서 업로드할 수 없습니다. (최대 50MB)',
  BAD_REQUEST: '지원하지 않는 파일입니다. (.md, .txt, .pdf)',
  LLM_SERVER_ERROR: '문서 처리 서버에 일시적인 오류가 발생했습니다.',
}

const DELETE_ERRORS: Record<string, string> = {
  CONFLICT:
    '파일을 처리(색인)하는 중이라 삭제할 수 없습니다. 처리가 끝난 뒤 다시 시도해주세요.',
  LLM_SERVER_ERROR:
    '문서 처리 서버에 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
}

type DocumentStatusResponse = AxiosResponse<GetProjectDocumentStatusResponse>

export const useProjectDocuments = (projectId: string | undefined) => {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: projectDocumentsKey(projectId),
    queryFn: () => getProjectDocuments(projectId as string),
    enabled: !!accessToken && !!projectId,
  })
}

export const useUploadProjectDocument = (projectId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadProjectDocument(projectId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectDocumentsKey(projectId),
      })
    },
    // 훅 레벨 콜백이라 업로드 중 페이지를 떠나도 실패를 알린다.
    onError: (e, file) => {
      const { detail } = readApiError(e)
      const fallback = describeApiError(
        e,
        UPLOAD_ERRORS,
        '업로드에 실패했습니다. 잠시 후 다시 시도해주세요.',
        '업로드 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.',
      )
      showToast(`'${file.name}' ${detail ?? fallback}`)
    },
  })
}

export const projectDocumentDeleteKey = (projectId: string) => [
  'projects',
  'documents',
  'delete',
  projectId,
]

export const useDeleteProjectDocument = (projectId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: projectDocumentDeleteKey(projectId),
    mutationFn: (documentId: string) =>
      deleteProjectDocument(projectId, documentId),
    onSuccess: (_d, documentId) => {
      // 목록 재조회가 끝나기 전에 '삭제 중' 표시가 풀려 행이 잠깐 되살아나 보이지 않도록 먼저 뺀다.
      queryClient.setQueryData<AxiosResponse<GetProjectDocumentsResponse>>(
        projectDocumentsKey(projectId),
        (old) => {
          if (!old) return old
          const docs = old.data.data.documents.filter(
            (d) => d.document_id !== documentId,
          )
          return {
            ...old,
            data: {
              ...old.data,
              data: {
                ...old.data.data,
                documents: docs,
                total: Math.max(0, old.data.data.total - 1),
              },
            },
          }
        },
      )
      queryClient.removeQueries({
        queryKey: projectDocumentStatusKey(projectId, documentId),
      })
      queryClient.invalidateQueries({
        queryKey: projectDocumentsKey(projectId),
      })
    },
    onError: (e) => {
      const { code, detail } = readApiError(e)
      if (code === 'DOCUMENT_NOT_FOUND') {
        // 이미 지워진 파일: 목록만 맞춘다.
        showToast('이미 삭제된 파일입니다.')
        queryClient.invalidateQueries({
          queryKey: projectDocumentsKey(projectId),
        })
        return
      }
      const fallback = describeApiError(
        e,
        DELETE_ERRORS,
        '파일을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.',
      )
      showToast(detail ? `파일을 삭제하지 못했습니다. (${detail})` : fallback)
    },
  })
}

export const useRetryProjectDocument = (projectId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (documentId: string) =>
      retryProjectDocument(projectId, documentId),
    onSuccess: (res, documentId) => {
      // 상태 쿼리 키(['projects','documents','status',...])는 아래 목록 무효화에 걸리지 않는다.
      // 이전 'error' 캐시를 재시도 응답의 상태(pending 등)로 바로 덮어써, 목록 API가 늦게
      // 갱신되더라도 화면 표시와 폴링이 곧바로 재개되게 한다.
      // 재시도 응답과 상태 응답은 data 모양이 같다(오류 코드 목록만 다르고, 성공 응답의 error는 null이다).
      queryClient.setQueryData<DocumentStatusResponse>(
        projectDocumentStatusKey(projectId, documentId),
        { ...res, data: { ...res.data, error: null } },
      )
      queryClient.invalidateQueries({
        queryKey: projectDocumentsKey(projectId),
      })
    },
  })
}

export const useProjectDocumentStatus = (
  projectId: string | undefined,
  documentId: string | undefined,
  active: boolean,
) => {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()
  const settledRef = useRef(false)
  const queryKey = projectDocumentStatusKey(projectId, documentId)
  // 목록상 상태(active)뿐 아니라 캐시된 상태가 진행 중이어도 폴링한다(재시도 직후 목록이 아직 'error'인 경우).
  const cachedStatus =
    queryClient.getQueryData<DocumentStatusResponse>(queryKey)?.data?.data
      ?.status
  const cachedInProgress =
    cachedStatus === 'pending' ||
    cachedStatus === 'queued' ||
    cachedStatus === 'running'
  const query = useQuery({
    queryKey,
    queryFn: () =>
      getProjectDocumentStatus(projectId as string, documentId as string),
    enabled:
      !!accessToken &&
      !!projectId &&
      !!documentId &&
      (active || cachedInProgress),
    refetchInterval: (q) => {
      const status = q.state.data?.data.data.status
      return status === 'done' || status === 'error' ? false : 12000
    },
  })

  const status = query.data?.data.data.status
  useEffect(() => {
    if (status === 'done' || status === 'error') {
      if (!settledRef.current) {
        settledRef.current = true
        queryClient.invalidateQueries({
          queryKey: projectDocumentsKey(projectId),
        })
      }
    } else if (status) {
      // 재시도로 다시 진행 중이 되면 완료 시 목록을 한 번 더 갱신할 수 있게 한다.
      settledRef.current = false
    }
  }, [status, projectId, queryClient])

  return query
}
