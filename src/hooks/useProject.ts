import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProjects, getProject, createProject } from '../api/services/project'
import type { CreateProjectRequest } from '../types/project'
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
