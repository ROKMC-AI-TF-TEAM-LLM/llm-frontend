// 프로젝트 목록·상세·하위 대화의 React Query 훅(조회·변경)
import { useMemo } from 'react'
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useMutationState,
  useQueryClient,
} from '@tanstack/react-query'
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  setProjectFavorite,
  setProjectInstruction,
  getProjectSessions,
  deleteProject,
} from '../api'
import type { CreateProjectRequest, GetProjectSessionsParams } from '../types'
import { useAuth } from '@/features/auth/useAuth'
import { showToast } from '@/shared/store/toastStore'
import { readApiError } from '@/shared/utils/error'
import {
  PROJECTS_ALL_KEY,
  PROJECTS_INFINITE_PREFIX,
  PROJECT_DELETE_KEY,
  PROJECT_MUTATION_PREFIX,
  cancelProjectQueries,
  patchProjectCaches,
  projectDetailKey,
  projectDocumentsKey,
  rollback,
  settleProjects,
  type ProjectDetail,
  type ProjectsInfinite,
} from './cache'
import { SESSIONS_KEY, projectSessionsKey } from '@/lib/queryKeys'

export interface ProjectView {
  id: string
  name: string
  isFavorite: boolean
  instructions: string
}

export const useInfiniteProjects = (isFavorite?: boolean) => {
  const { accessToken } = useAuth()
  return useInfiniteQuery({
    queryKey: ['projects', 'infinite', isFavorite ?? 'all'],
    queryFn: ({ pageParam }) =>
      getProjects({
        cursor: pageParam as string | undefined,
        is_favorite: isFavorite,
      }),
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
      .map((it) => ({
        id: it.project_id,
        name: it.title ?? '',
        isFavorite: it.is_favorite,
        instructions: '',
      }))
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
    if (d)
      return {
        id: d.project_id,
        name: d.title ?? '',
        isFavorite: d.is_favorite,
        instructions: d.instructions ?? '',
      }
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
      queryClient.setQueryData<ProjectDetail>(
        projectDetailKey(created.project_id),
        {
          ...res,
          data: {
            success: true,
            status_code: res.data.status_code,
            data: created,
            error: null,
          },
        },
      )
      queryClient.setQueryData<ProjectsInfinite>(PROJECTS_ALL_KEY, (old) => {
        if (!old || old.pages.length === 0) return old
        const [first, ...rest] = old.pages
        if (
          first.data.data.items.some(
            (it) => it.project_id === created.project_id,
          )
        )
          return old
        const item = {
          project_id: created.project_id,
          title: created.title,
          is_favorite: created.is_favorite,
        }
        return {
          ...old,
          pages: [
            {
              ...first,
              data: {
                ...first.data,
                data: {
                  ...first.data.data,
                  items: [item, ...first.data.data.items],
                },
              },
            },
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
      return {
        snapshots: patchProjectCaches(queryClient, projectId, { title }),
      }
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
      return {
        snapshots: patchProjectCaches(queryClient, projectId, {
          is_favorite: next,
        }),
      }
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
    mutationFn: ({
      projectId,
      instructions,
    }: {
      projectId: string
      instructions: string
    }) =>
      setProjectInstruction(projectId, {
        instructions: instructions.trim() === '' ? null : instructions,
      }),
    onMutate: async ({ projectId, instructions }) => {
      await queryClient.cancelQueries({ queryKey: projectDetailKey(projectId) })
      return {
        snapshots: patchProjectCaches(queryClient, projectId, { instructions }),
      }
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
      queryClient.removeQueries({ queryKey: projectSessionsKey(projectId) })
      queryClient.removeQueries({ queryKey: projectDocumentsKey(projectId) })
    },
    onError: (e, _projectId, ctx) => {
      rollback(queryClient, ctx?.snapshots)
      // 삭제 요청 직후 화면을 떠나므로 실패를 알리지 않으면 사용자는 알 수 없다.
      const { detail } = readApiError(e)
      showToast(
        detail
          ? `프로젝트를 삭제하지 못했습니다. (${detail})`
          : '프로젝트를 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.',
      )
    },
    onSettled: (_d, e) => {
      settleProjects(queryClient, !!e)
      // 전역 세션 목록(사이드바 최근 대화)에도 프로젝트 하위 세션이 들어 있다.
      queryClient.invalidateQueries({ queryKey: SESSIONS_KEY })
    },
  })
}

export const useProjectSessions = (
  projectId: string | undefined,
  params?: GetProjectSessionsParams,
) => {
  const { accessToken } = useAuth()
  return useInfiniteQuery({
    queryKey: projectSessionsKey(projectId),
    queryFn: ({ pageParam }) =>
      getProjectSessions(projectId as string, {
        ...params,
        cursor: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) => {
      const data = lastPage.data.data
      return data.has_next && data.next_cursor ? data.next_cursor : undefined
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!accessToken && !!projectId,
  })
}
