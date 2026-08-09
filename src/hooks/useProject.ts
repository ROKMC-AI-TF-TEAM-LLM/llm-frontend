import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProjects, getProject, createProject, updateProject,
  setProjectFavorite, setProjectInstruction, getProjectSessions,
} from '../api/services/project'
import type { CreateProjectRequest, GetProjectSessionsParams } from '../types/project'
import { useProjectStore } from '../features/projects/projectStore'
import { useAuth } from '../context/AuthContext'

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
