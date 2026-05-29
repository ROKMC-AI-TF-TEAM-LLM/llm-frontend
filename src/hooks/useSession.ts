import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSessions, createSession, searchSessions, updateSession, deleteSession } from '../api/services/session'
import type { CreateSessionRequest, SearchSessionsRequest, UpdateSessionRequest } from '../types/session'
import { useAuth } from '../context/AuthContext'

export const useGetSessions = () => {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => getSessions(),
    enabled: !!accessToken,
  })
}

export const useInfiniteSessions = () => {
  const { accessToken } = useAuth()
  return useInfiniteQuery({
    queryKey: ['sessions', 'infinite'],
    queryFn: ({ pageParam }) => getSessions(pageParam as string | undefined),
    getNextPageParam: (lastPage) => {
      const data = lastPage.data.data
      return data.has_next && data.next_cursor ? data.next_cursor : undefined
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!accessToken,
  })
}

export const useCreateSession = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSessionRequest) => createSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export const useSearchSessions = (params: SearchSessionsRequest) => {
  return useQuery({
    queryKey: ['sessions', 'search', params.q],
    queryFn: () => searchSessions(params),
    enabled: params.q.length > 0,
  })
}

export const useUpdateSession = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: UpdateSessionRequest }) =>
      updateSession(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export const useDeleteSession = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}
