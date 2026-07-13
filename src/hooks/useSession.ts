import { useQuery, useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import type { AxiosResponse } from 'axios'
import { getSessions, createSession, searchSessions, updateSession, setFavorite, deleteSession } from '../api/services/session'
import type { CreateSessionRequest, SearchSessionsRequest, UpdateSessionRequest, GetSessionsResponse } from '../types/session'
import { useAuth } from '../context/AuthContext'

const SESSIONS_INFINITE_KEY = ['sessions', 'infinite'] as const

// useInfiniteSessions 캐시의 실제 형태 (페이지 = axios 응답)
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

/**
 * 즐겨찾기 토글 — 낙관적 업데이트(즉시 별이 켜지고, 실패하면 롤백).
 * 전용 엔드포인트 PATCH /sessions/{id}/favorite 를 사용한다(제목 수정 PATCH와 별개).
 */
export const useToggleFavorite = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, next }: { sessionId: string; next: boolean }) =>
      setFavorite(sessionId, { is_favorite: next }),

    // 요청 직전: 캐시를 먼저 바꾸고(즉각 반응), 롤백용 스냅샷을 남긴다.
    onMutate: async ({ sessionId, next }) => {
      // 진행 중이던 목록 refetch가 나중에 도착해 낙관적 변경을 덮어쓰는 것을 막는다.
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

    // 실패하면 스냅샷으로 되돌린다.
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(SESSIONS_INFINITE_KEY, context.prev)
    },

    // 성공/실패 무관하게 서버 기준으로 재동기화.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}
