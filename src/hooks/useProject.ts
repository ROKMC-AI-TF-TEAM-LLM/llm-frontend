import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProjects, getProject, createProject, updateProject,
  setProjectFavorite, setProjectInstruction, getProjectSessions,
} from '../api/services/project'
import type { CreateProjectRequest, GetProjectSessionsParams } from '../types/project'
import { useProjectStore } from '../features/projects/projectStore'
import { useAuth } from '../context/AuthContext'

// 프로젝트 목록(커서 무한스크롤). is_favorite 필터는 목록을 나눌 때 쓴다(생략 시 전체).
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

// 프로젝트 상세(지침 포함). 프로젝트 화면 진입 시 사용.
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

// 프로젝트 제목 수정. 낙관적 업데이트: 스토어에 즉시 반영하고, 실패하면 이전 이름으로 되돌린다.
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

// 프로젝트 즐겨찾기 토글. 낙관적 업데이트 후 실패 시 롤백.
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

// 프로젝트 지침 설정/수정. null·빈 문자열이면 서버에서 지침이 삭제된다.
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

// 프로젝트 하위 대화 세션 목록(커서 무한스크롤).
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
