import { useQuery, useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import type { AxiosResponse } from 'axios'
import { getSessions, createSession, searchSessions, updateSession, setFavorite, deleteSession } from '../api/services/session'
import type { CreateSessionRequest, SearchSessionsRequest, UpdateSessionRequest, GetSessionsResponse } from '../types/session'
import { useAuth } from '../context/AuthContext'

const SESSIONS_INFINITE_KEY = ['sessions', 'infinite'] as const

type SessionsInfinite = InfiniteData<AxiosResponse<GetSessionsResponse>, string | undefined>

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
      queryClient.invalidateQueries({ queryKey: ['projects', 'sessions'] })
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
      queryClient.invalidateQueries({ queryKey: ['projects', 'sessions'] })
    },
  })
}

export const useDeleteSession = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['projects', 'sessions'] })
    },
  })
}

export const useToggleFavorite = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, next }: { sessionId: string; next: boolean }) =>
      setFavorite(sessionId, { is_favorite: next }),

    onMutate: async ({ sessionId, next }) => {
      await queryClient.cancelQueries({ queryKey: ['sessions'] })
      const prev = queryClient.getQueryData<SessionsInfinite>(SESSIONS_INFINITE_KEY)

      queryClient.setQueryData<SessionsInfinite>(SESSIONS_INFINITE_KEY, (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              data: {
                ...page.data.data,
                items: page.data.data.items.map((s) =>
                  s.session_id === sessionId ? { ...s, is_favorite: next } : s,
                ),
              },
            },
          })),
        }
      })

      return { prev }
    },

    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(SESSIONS_INFINITE_KEY, context.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['projects', 'sessions'] })
    },
  })
}
