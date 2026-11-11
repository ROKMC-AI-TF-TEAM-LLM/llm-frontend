import { useEffect, useMemo, useRef } from 'react'
import { useQuery, useInfiniteQuery, useMutation, useMutationState, useQueryClient, type InfiniteData, type QueryClient } from '@tanstack/react-query'
import {
  getProjects, getProject, createProject, updateProject,
  setProjectFavorite, setProjectInstruction, getProjectSessions, deleteProject,
  uploadProjectDocument, getProjectDocuments, getProjectDocumentStatus, deleteProjectDocument, retryProjectDocument,
} from './api'
import type { AxiosResponse } from 'axios'
import { useLocation, useNavigate } from 'react-router-dom'
import type {
  CreateProjectRequest, GetProjectSessionsParams, GetProjectDocumentStatusResponse, GetProjectDocumentsResponse,
  GetProjectsResponse, GetProjectResponse, ProjectData,
} from './types'
import { useAuth } from '@/features/auth/useAuth'
import { showToast } from '@/shared/store/toastStore'
import { confirm } from '@/shared/store/confirmStore'
import { isNetworkError, readApiError, type ApiError } from '@/shared/utils/error'

// 프로젝트 목록·상세의 단일 출처는 React Query 캐시다.
// (예전에는 zustand 스토어에 복사해 썼는데, 서버 응답이 올 때마다 스토어를 통째로 덮어써
//  낙관적 변경이 되돌아가거나 삭제한 프로젝트가 되살아나는 문제가 있었다.)

export interface ProjectView {
  id: string
  name: string
  isFavorite: boolean
  instructions: string
}

type ProjectsInfinite = InfiniteData<AxiosResponse<GetProjectsResponse>, string | undefined>
type ProjectDetail = AxiosResponse<GetProjectResponse>
type Snapshot = [readonly unknown[], unknown]

const PROJECTS_INFINITE_PREFIX = ['projects', 'infinite'] as const
const PROJECTS_ALL_KEY = ['projects', 'infinite', 'all'] as const
const projectDetailKey = (projectId: string | undefined) => ['projects', 'detail', projectId] as const

// 프로젝트를 바꾸는 mutation은 모두 이 접두사를 쓴다.
// 여러 변경이 겹칠 때 마지막 것만 목록을 다시 받게 해, 중간 상태 응답이 화면을 되돌리지 않게 한다.
const PROJECT_MUTATION_PREFIX = ['projects', 'mutate'] as const
const PROJECT_DELETE_KEY = ['projects', 'mutate', 'delete'] as const

type ProjectPatch = Partial<Pick<ProjectData, 'title' | 'is_favorite' | 'instructions'>>

// 목록(모든 infinite 쿼리)과 상세 캐시에 같은 변경을 적용하고, 롤백용 스냅샷을 돌려준다.
// patch가 null이면 목록에서 제거한다.
const patchProjectCaches = (qc: QueryClient, projectId: string, patch: ProjectPatch | null): Snapshot[] => {
  const snapshots: Snapshot[] = []
  for (const [key, data] of qc.getQueriesData<ProjectsInfinite>({ queryKey: PROJECTS_INFINITE_PREFIX })) {
    if (!data) continue
    snapshots.push([key, data])
    qc.setQueryData<ProjectsInfinite>(key, {
      ...data,
      pages: data.pages.map((page) => {
        const items = page.data.data.items
        const nextItems = patch
          ? items.map((it) =>
              it.project_id === projectId
                ? {
                    ...it,
                    ...(patch.title !== undefined ? { title: patch.title } : {}),
                    ...(patch.is_favorite !== undefined ? { is_favorite: patch.is_favorite } : {}),
                  }
                : it,
            )
          : items.filter((it) => it.project_id !== projectId)
        return { ...page, data: { ...page.data, data: { ...page.data.data, items: nextItems } } }
      }),
    })
  }
  if (patch) {
    const key = projectDetailKey(projectId)
    const detail = qc.getQueryData<ProjectDetail>(key)
    if (detail?.data?.data) {
      snapshots.push([key, detail])
      qc.setQueryData<ProjectDetail>(key, {
        ...detail,
        data: { ...detail.data, data: { ...detail.data.data, ...patch } },
      })
    }
  }
  return snapshots
}

const rollback = (qc: QueryClient, snapshots: Snapshot[] | undefined) => {
  if (!snapshots) return
  for (const [key, data] of snapshots) qc.setQueryData(key, data)
}

const cancelProjectQueries = async (qc: QueryClient, projectId: string) => {
  await qc.cancelQueries({ queryKey: PROJECTS_INFINITE_PREFIX })
  await qc.cancelQueries({ queryKey: projectDetailKey(projectId) })
}

// 마지막으로 끝난 변경만 서버 값을 다시 받는다. 실패했으면(force) 항상 다시 받는다.
// onSettled 시점의 mutation은 아직 pending으로 집계되므로, 1이면 '내가 마지막'이다.
const settleProjects = (qc: QueryClient, force = false) => {
  if (!force && qc.isMutating({ mutationKey: PROJECT_MUTATION_PREFIX }) > 1) return
  qc.invalidateQueries({ queryKey: PROJECTS_INFINITE_PREFIX })
  qc.invalidateQueries({ queryKey: ['projects', 'detail'] })
}

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

// 사이드바용 프로젝트 목록. 삭제 요청 중인 프로젝트는 그사이 목록을 다시 받아도 보이지 않게 거른다.
export const useProjectList = () => {
  const query = useInfiniteProjects()
  const deletingIds = useMutationState({
    filters: { mutationKey: PROJECT_DELETE_KEY, status: 'pending' },
    select: (m) => m.state.variables as string,
  })
  const deletingKey = deletingIds.join(',')
  const projects = useMemo<ProjectView[]>(() => {
    const hidden = new Set(deletingKey ? deletingKey.split(',') : [])
    return (query.data?.pages ?? [])
      .flatMap((p) => p.data.data.items)
      .filter((it) => !hidden.has(it.project_id))
      .map((it) => ({ id: it.project_id, name: it.title ?? '', isFavorite: it.is_favorite, instructions: '' }))
  }, [query.data, deletingKey])
  return { ...query, projects }
}

export const useProject = (projectId: string | undefined) => {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: projectDetailKey(projectId),
    queryFn: () => getProject(projectId as string),
    enabled: !!accessToken && !!projectId,
  })
}

// 프로젝트 페이지용. 상세를 우선 쓰고, 상세가 오기 전에는 사이드바 목록에 있는 값으로 먼저 그린다.
export const useProjectView = (projectId: string | undefined) => {
  const detail = useProject(projectId)
  const { projects } = useProjectList()
  const fromList = projects.find((p) => p.id === projectId)
  const d = detail.data?.data?.data
  const project = useMemo<ProjectView | undefined>(() => {
    if (d) return { id: d.project_id, name: d.title ?? '', isFavorite: d.is_favorite, instructions: d.instructions ?? '' }
    return fromList
  }, [d, fromList])
  return { project, isLoading: detail.isLoading, isError: detail.isError }
}

export const useCreateProject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [...PROJECT_MUTATION_PREFIX, 'create'],
    mutationFn: (data: CreateProjectRequest) => createProject(data),
    onSuccess: (res) => {
      const created = res.data.data
      // 이동한 프로젝트 페이지가 곧바로 그려지도록 상세 캐시를 채우고, 목록 맨 앞에도 넣는다.
      queryClient.setQueryData<ProjectDetail>(projectDetailKey(created.project_id), {
        ...res,
        data: { success: true, status_code: res.data.status_code, data: created, error: null },
      })
      queryClient.setQueryData<ProjectsInfinite>(PROJECTS_ALL_KEY, (old) => {
        if (!old || old.pages.length === 0) return old
        const [first, ...rest] = old.pages
        if (first.data.data.items.some((it) => it.project_id === created.project_id)) return old
        const item = { project_id: created.project_id, title: created.title, is_favorite: created.is_favorite }
        return {
          ...old,
          pages: [
            { ...first, data: { ...first.data, data: { ...first.data.data, items: [item, ...first.data.data.items] } } },
            ...rest,
          ],
        }
      })
    },
    onSettled: () => settleProjects(queryClient),
  })
}

export const useUpdateProject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [...PROJECT_MUTATION_PREFIX, 'update'],
    mutationFn: ({ projectId, title }: { projectId: string; title: string }) =>
      updateProject(projectId, { title }),
    onMutate: async ({ projectId, title }) => {
      await cancelProjectQueries(queryClient, projectId)
      return { snapshots: patchProjectCaches(queryClient, projectId, { title }) }
    },
    onError: (_e, _v, ctx) => {
      rollback(queryClient, ctx?.snapshots)
      showToast('프로젝트 이름을 바꾸지 못했습니다. 잠시 후 다시 시도해주세요.')
    },
    onSettled: (_d, e) => settleProjects(queryClient, !!e),
  })
}

export const useToggleProjectFavorite = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [...PROJECT_MUTATION_PREFIX, 'favorite'],
    mutationFn: ({ projectId, next }: { projectId: string; next: boolean }) =>
      setProjectFavorite(projectId, { is_favorite: next }),
    onMutate: async ({ projectId, next }) => {
      await cancelProjectQueries(queryClient, projectId)
      return { snapshots: patchProjectCaches(queryClient, projectId, { is_favorite: next }) }
    },
    onError: (_e, _v, ctx) => {
      rollback(queryClient, ctx?.snapshots)
      showToast('즐겨찾기를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.')
    },
    onSettled: (_d, e) => settleProjects(queryClient, !!e),
  })
}

export const useSetProjectInstruction = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [...PROJECT_MUTATION_PREFIX, 'instruction'],
    mutationFn: ({ projectId, instructions }: { projectId: string; instructions: string }) =>
      setProjectInstruction(projectId, { instructions: instructions.trim() === '' ? null : instructions }),
    onMutate: async ({ projectId, instructions }) => {
      await queryClient.cancelQueries({ queryKey: projectDetailKey(projectId) })
      return { snapshots: patchProjectCaches(queryClient, projectId, { instructions }) }
    },
    onError: (_e, _v, ctx) => {
      rollback(queryClient, ctx?.snapshots)
      showToast('지침을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.')
    },
    onSettled: (_d, _e, v) => {
      queryClient.invalidateQueries({ queryKey: projectDetailKey(v.projectId) })
    },
  })
}

export const useDeleteProject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: PROJECT_DELETE_KEY,
    mutationFn: (projectId: string) => deleteProject(projectId),
    onMutate: async (projectId) => {
      await queryClient.cancelQueries({ queryKey: PROJECTS_INFINITE_PREFIX })
      return { snapshots: patchProjectCaches(queryClient, projectId, null) }
    },
    onSuccess: (_d, projectId) => {
      // 이미 페이지를 떠났으므로 이 프로젝트의 캐시는 버린다.
      queryClient.removeQueries({ queryKey: projectDetailKey(projectId) })
      queryClient.removeQueries({ queryKey: ['projects', 'sessions', projectId] })
      queryClient.removeQueries({ queryKey: ['projects', 'documents', projectId] })
    },
    onError: (e, _projectId, ctx) => {
      rollback(queryClient, ctx?.snapshots)
      // 삭제 요청 직후 화면을 떠나므로 실패를 알리지 않으면 사용자는 알 수 없다.
      const { detail } = readApiError(e)
      showToast(detail ? `프로젝트를 삭제하지 못했습니다. (${detail})` : '프로젝트를 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.')
    },
    onSettled: (_d, e) => {
      settleProjects(queryClient, !!e)
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
  return async (project: { id: string; name: string }) => {
    const ok = await confirm({
      title: `'${project.name}' 프로젝트를 삭제하시겠습니까?`,
      message: '하위 대화와 메시지, 업로드한 참고 파일이 모두 함께 삭제되며 되돌릴 수 없습니다.',
      danger: true,
    })
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
    // 훅 레벨 콜백이라 업로드 중 페이지를 떠나도 실패를 알린다.
    onError: (e, file) => {
      const { code, detail } = readApiError(e)
      const fallback =
        code === 'FILE_TOO_LARGE'
          ? '파일이 너무 커서 업로드할 수 없습니다. (최대 50MB)'
          : code === 'BAD_REQUEST'
            ? '지원하지 않는 파일입니다. (.md, .txt, .pdf)'
            : code === 'LLM_SERVER_ERROR'
              ? '문서 처리 서버에 일시적인 오류가 발생했습니다.'
              : (e as ApiError)?.code === 'ECONNABORTED'
                ? '업로드 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.'
                : isNetworkError(e)
                  ? '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.'
                  : '업로드에 실패했습니다. 잠시 후 다시 시도해주세요.'
      showToast(`'${file.name}' ${detail ?? fallback}`)
    },
  })
}

export const projectDocumentDeleteKey = (projectId: string) => ['projects', 'documents', 'delete', projectId]

export const useDeleteProjectDocument = (projectId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: projectDocumentDeleteKey(projectId),
    mutationFn: (documentId: string) => deleteProjectDocument(projectId, documentId),
    onSuccess: (_d, documentId) => {
      // 목록 재조회가 끝나기 전에 '삭제 중' 표시가 풀려 행이 잠깐 되살아나 보이지 않도록 먼저 뺀다.
      queryClient.setQueryData<AxiosResponse<GetProjectDocumentsResponse>>(
        ['projects', 'documents', projectId],
        (old) => {
          if (!old) return old
          const docs = old.data.data.documents.filter((d) => d.document_id !== documentId)
          return {
            ...old,
            data: {
              ...old.data,
              data: { ...old.data.data, documents: docs, total: Math.max(0, old.data.data.total - 1) },
            },
          }
        },
      )
      queryClient.removeQueries({ queryKey: ['projects', 'documents', 'status', projectId, documentId] })
      queryClient.invalidateQueries({ queryKey: ['projects', 'documents', projectId] })
    },
    onError: (e) => {
      const { code, detail } = readApiError(e)
      if (code === 'DOCUMENT_NOT_FOUND') {
        // 이미 지워진 파일: 목록만 맞춘다.
        showToast('이미 삭제된 파일입니다.')
        queryClient.invalidateQueries({ queryKey: ['projects', 'documents', projectId] })
        return
      }
      const fallback =
        code === 'CONFLICT'
          ? '파일을 처리(색인)하는 중이라 삭제할 수 없습니다. 처리가 끝난 뒤 다시 시도해주세요.'
          : code === 'LLM_SERVER_ERROR'
            ? '문서 처리 서버에 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
            : isNetworkError(e)
              ? '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.'
              : '파일을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.'
      showToast(detail ? `파일을 삭제하지 못했습니다. (${detail})` : fallback)
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
