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
    onMutate: async ({ sessionId, data }) => {
      if (data.title === undefined) return { snapshots: undefined }
      await queryClient.cancelQueries({ queryKey: ['sessions'] })
      await queryClient.cancelQueries({ queryKey: ['projects', 'sessions'] })
      const snapshots = optimisticallyPatchSession(queryClient, sessionId, (s) => ({
        ...s,
        title: data.title as string,
      }))
      return { snapshots }
    },
    onError: (_err, _vars, context) => rollbackSnapshots(queryClient, context?.snapshots),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['projects', 'sessions'] })
    },
  })
}

export const useDeleteSession = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => deleteSession(sessionId),
    onMutate: async (sessionId) => {
      await queryClient.cancelQueries({ queryKey: ['sessions'] })
      await queryClient.cancelQueries({ queryKey: ['projects', 'sessions'] })

      const snapshots: [readonly unknown[], SessionsInfinite | undefined][] = []
      const dropSession = (old: SessionsInfinite | undefined) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              data: {
                ...page.data.data,
                items: page.data.data.items.filter((s) => s.session_id !== sessionId),
              },
            },
          })),
        }
      }

      snapshots.push([SESSIONS_INFINITE_KEY, queryClient.getQueryData(SESSIONS_INFINITE_KEY)])
      queryClient.setQueryData<SessionsInfinite>(SESSIONS_INFINITE_KEY, dropSession)

      for (const [key, data] of queryClient.getQueriesData<SessionsInfinite>({
        queryKey: ['projects', 'sessions'],
      })) {
        snapshots.push([key, data])
        queryClient.setQueryData<SessionsInfinite>(key, dropSession)
      }

      return { snapshots }
    },
    onError: (_err, _vars, context) => rollbackSnapshots(queryClient, context?.snapshots),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['projects', 'sessions'] })
    },
  })
}

// 세션 목록 캐시(전역 ['sessions','infinite'] · 프로젝트별 ['projects','sessions',*])는
// 페이지 구조가 같으므로 한 헬퍼로 낙관적 수정을 적용한다.
const patchSessionInPages = <T extends SessionsInfinite>(
  old: T | undefined,
  sessionId: string,
  patch: (s: T['pages'][number]['data']['data']['items'][number]) => T['pages'][number]['data']['data']['items'][number],
): T | undefined => {
  if (!old) return old
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      data: {
        ...page.data,
        data: {
          ...page.data.data,
          items: page.data.data.items.map((s) => (s.session_id === sessionId ? patch(s) : s)),
        },
      },
    })),
  }
}

// 전역 목록과 열려 있는 모든 프로젝트 세션 목록에 동시에 적용하고, 롤백용 스냅샷을 돌려준다.
const optimisticallyPatchSession = (
  queryClient: ReturnType<typeof useQueryClient>,
  sessionId: string,
  patch: (s: GetSessionsResponse['data']['items'][number]) => GetSessionsResponse['data']['items'][number],
) => {
  const snapshots: [readonly unknown[], SessionsInfinite | undefined][] = []

  const global = queryClient.getQueryData<SessionsInfinite>(SESSIONS_INFINITE_KEY)
  snapshots.push([SESSIONS_INFINITE_KEY, global])
  queryClient.setQueryData<SessionsInfinite>(SESSIONS_INFINITE_KEY, (old) =>
    patchSessionInPages(old, sessionId, patch),
  )

  const projectQueries = queryClient.getQueriesData<SessionsInfinite>({
    queryKey: ['projects', 'sessions'],
  })
  for (const [key, data] of projectQueries) {
    snapshots.push([key, data])
    queryClient.setQueryData<SessionsInfinite>(key, (old) =>
      patchSessionInPages(old, sessionId, patch),
    )
  }

  return snapshots
}

const rollbackSnapshots = (
  queryClient: ReturnType<typeof useQueryClient>,
  snapshots: [readonly unknown[], SessionsInfinite | undefined][] | undefined,
) => {
  if (!snapshots) return
  for (const [key, data] of snapshots) queryClient.setQueryData(key, data)
}

export const useToggleFavorite = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, next }: { sessionId: string; next: boolean }) =>
      setFavorite(sessionId, { is_favorite: next }),

    onMutate: async ({ sessionId, next }) => {
      await queryClient.cancelQueries({ queryKey: ['sessions'] })
      await queryClient.cancelQueries({ queryKey: ['projects', 'sessions'] })
      const snapshots = optimisticallyPatchSession(queryClient, sessionId, (s) => ({
        ...s,
        is_favorite: next,
      }))
      return { snapshots }
    },

    onError: (_err, _vars, context) => rollbackSnapshots(queryClient, context?.snapshots),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['projects', 'sessions'] })
    },
  })
}
