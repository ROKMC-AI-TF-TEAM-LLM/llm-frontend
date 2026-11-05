import { useEffect, useRef } from 'react'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProjects, getProject, createProject, updateProject,
  setProjectFavorite, setProjectInstruction, getProjectSessions, deleteProject,
  uploadProjectDocument, getProjectDocuments, getProjectDocumentStatus, deleteProjectDocument, retryProjectDocument,
} from '../api/services/project'
import type { AxiosResponse } from 'axios'
import { useLocation, useNavigate } from 'react-router-dom'
import type { CreateProjectRequest, GetProjectSessionsParams, GetProjectDocumentStatusResponse } from '../types/project'
import { useProjectStore } from '../features/projects/projectStore'
import { useAuth } from '../context/AuthContext'
import { showToast } from '../api/store/toastStore'

export const useInfiniteProjects = (isFavorite?: boolean) => {
  const { accessToken } = useAuth()
  return useInfiniteQuery({
    queryKey: ['projects', 'infinite', isFavorite ?? 'all'],
    queryFn: ({ pageParam }) =>
      getProjects({ cursor: pageParam as string | undefined, is_favorite: isFavorite }),
    getNextPageParam: (lastPage) => {
      const data = lastPage.data.data
      return data.has_next && data.next_cursor ? data.next_cursor : undefined
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!accessToken,
  })
}

export const useProject = (projectId: string | undefined) => {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['projects', 'detail', projectId],
    queryFn: () => getProject(projectId as string),
    enabled: !!accessToken && !!projectId,
  })
}

export const useCreateProject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateProjectRequest) => createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export const useUpdateProject = () => {
  const queryClient = useQueryClient()
  const rename = useProjectStore((s) => s.rename)
  return useMutation({
    mutationFn: ({ projectId, title }: { projectId: string; title: string }) =>
      updateProject(projectId, { title }),
    onMutate: ({ projectId, title }) => {
      const prev = useProjectStore.getState().projects.find((p) => p.id === projectId)?.name
      rename(projectId, title)
      return { projectId, prevName: prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prevName != null) rename(ctx.projectId, ctx.prevName)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export const useToggleProjectFavorite = () => {
  const queryClient = useQueryClient()
  const setFavorite = useProjectStore((s) => s.setFavorite)
  return useMutation({
    mutationFn: ({ projectId, next }: { projectId: string; next: boolean }) =>
      setProjectFavorite(projectId, { is_favorite: next }),
    onMutate: ({ projectId, next }) => {
      const prev = useProjectStore.getState().projects.find((p) => p.id === projectId)?.isFavorite
      setFavorite(projectId, next)
      return { projectId, prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev != null) setFavorite(ctx.projectId, ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
export const useSetProjectInstruction = () => {
  const queryClient = useQueryClient()
  const setInstructions = useProjectStore((s) => s.setInstructions)
  return useMutation({
    mutationFn: ({ projectId, instructions }: { projectId: string; instructions: string }) =>
      setProjectInstruction(projectId, { instructions: instructions.trim() === '' ? null : instructions }),
    onMutate: ({ projectId, instructions }) => {
      const prev = useProjectStore.getState().projects.find((p) => p.id === projectId)?.instructions
      setInstructions(projectId, instructions)
      return { projectId, prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev != null) setInstructions(ctx.projectId, ctx.prev)
    },
    onSettled: (_d, _e, v) => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'detail', v.projectId] })
    },
  })
}

export const useDeleteProject = () => {
  const queryClient = useQueryClient()
  const remove = useProjectStore((s) => s.remove)
  return useMutation({
    mutationFn: (projectId: string) => deleteProject(projectId),
    onMutate: async (projectId) => {
      // 진행 중인 목록 요청이 삭제 전 데이터로 돌아와 setFromServer가 프로젝트를 되살리지 않게 한다.
      await queryClient.cancelQueries({ queryKey: ['projects', 'infinite'] })
      const prev = useProjectStore.getState().projects
      remove(projectId)
      return { prev }
    },
    onError: (e, _projectId, ctx) => {
      if (ctx?.prev) useProjectStore.setState({ projects: ctx.prev })
      // 삭제 요청 직후 화면을 떠나므로 실패를 알리지 않으면 사용자는 알 수 없다.
      const detail = (e as { response?: { data?: { error?: { detail?: string } } } })?.response?.data?.error?.detail
      showToast(detail ? `프로젝트를 삭제하지 못했습니다. (${detail})` : '프로젝트를 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      // 전역 세션 목록(사이드바 최근 대화)에도 프로젝트 하위 세션이 들어 있다.
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

// 프로젝트 삭제 진입점(프로젝트 페이지 메뉴·사이드바 목록·즐겨찾기)을 하나로 묶는다.
// 확인 → 서버 삭제 → 보고 있던 프로젝트면 새 채팅으로 이동.
export const useConfirmDeleteProject = () => {
  const { mutate } = useDeleteProject()
  const navigate = useNavigate()
  const location = useLocation()
  return (project: { id: string; name: string }) => {
    const ok = window.confirm(
      `'${project.name}' 프로젝트를 삭제하시겠습니까?\n\n하위 대화와 메시지, 업로드한 참고 파일이 모두 함께 삭제되며 되돌릴 수 없습니다.`,
    )
    if (!ok) return
    mutate(project.id)
    const base = `/projects/${project.id}`
    if (location.pathname === base || location.pathname.startsWith(`${base}/`)) navigate('/chat')
  }
}

export const useProjectSessions = (projectId: string | undefined, params?: GetProjectSessionsParams) => {
  const { accessToken } = useAuth()
  return useInfiniteQuery({
    queryKey: ['projects', 'sessions', projectId],
    queryFn: ({ pageParam }) =>
      getProjectSessions(projectId as string, { ...params, cursor: pageParam as string | undefined }),
    getNextPageParam: (lastPage) => {
      const data = lastPage.data.data
      return data.has_next && data.next_cursor ? data.next_cursor : undefined
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!accessToken && !!projectId,
  })
}

export const useProjectDocuments = (projectId: string | undefined) => {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['projects', 'documents', projectId],
    queryFn: () => getProjectDocuments(projectId as string),
    enabled: !!accessToken && !!projectId,
  })
}

export const useUploadProjectDocument = (projectId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadProjectDocument(projectId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'documents', projectId] })
    },
  })
}

export const useDeleteProjectDocument = (projectId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (documentId: string) => deleteProjectDocument(projectId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'documents', projectId] })
    },
  })
}

export const useRetryProjectDocument = (projectId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (documentId: string) => retryProjectDocument(projectId, documentId),
    onSuccess: (res, documentId) => {
      // 상태 쿼리 키(['projects','documents','status',...])는 아래 목록 무효화에 걸리지 않는다.
      // 이전 'error' 캐시를 재시도 응답의 상태(pending 등)로 바로 덮어써, 목록 API가 늦게
      // 갱신되더라도 화면 표시와 폴링이 곧바로 재개되게 한다.
      queryClient.setQueryData(
        ['projects', 'documents', 'status', projectId, documentId],
        res as unknown as AxiosResponse<GetProjectDocumentStatusResponse>,
      )
      queryClient.invalidateQueries({ queryKey: ['projects', 'documents', projectId] })
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
  const queryKey = ['projects', 'documents', 'status', projectId, documentId]
  // 목록상 상태(active)뿐 아니라 캐시된 상태가 진행 중이어도 폴링한다(재시도 직후 목록이 아직 'error'인 경우).
  const cachedStatus = queryClient.getQueryData<AxiosResponse<GetProjectDocumentStatusResponse>>(queryKey)?.data
    ?.data?.status
  const cachedInProgress = cachedStatus === 'pending' || cachedStatus === 'queued' || cachedStatus === 'running'
  const query = useQuery({
    queryKey,
    queryFn: () => getProjectDocumentStatus(projectId as string, documentId as string),
    enabled: !!accessToken && !!projectId && !!documentId && (active || cachedInProgress),
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
        queryClient.invalidateQueries({ queryKey: ['projects', 'documents', projectId] })
      }
    } else if (status) {
      // 재시도로 다시 진행 중이 되면 완료 시 목록을 한 번 더 갱신할 수 있게 한다.
      settledRef.current = false
    }
  }, [status, projectId, queryClient])

  return query
}
