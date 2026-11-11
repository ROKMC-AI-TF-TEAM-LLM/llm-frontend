import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import type { AxiosResponse } from 'axios'
import {
  getSessions,
  createSession,
  searchSessions,
  updateSession,
  setFavorite,
  deleteSession,
} from './api'
import type {
  CreateSessionRequest,
  SearchSessionsRequest,
  UpdateSessionRequest,
  GetSessionsResponse,
} from './types'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { clearChatCache } from '@/shared/utils/chatStorage'
import { showToast } from '@/shared/store/toastStore'
import { confirm } from '@/shared/store/confirmStore'
import { getApiError } from '@/shared/utils/error'
import { displaySessionTitle, SESSION_ERRORS } from './utils'
import {
  PROJECT_SESSIONS_KEY,
  SESSIONS_INFINITE_KEY,
  cancelSessionLists,
  invalidateSessionLists,
} from '@/lib/queryKeys'
import { nextCursor } from '@/shared/utils/pagination'

// 세션을 바꾸는 mutation 공통 접두사. 여러 변경(예: 즐겨찾기 연타)이 겹치면
// 마지막으로 끝난 것만 목록을 다시 받아, 중간 상태 응답이 화면을 되돌리지 않게 한다.
const SESSION_MUTATION_PREFIX = ['sessions', 'mutate'] as const

export const getSessionErrorMessage = (
  error: unknown,
  fallback = '오류가 발생했습니다.',
): string => getApiError(error, SESSION_ERRORS.mutation, {}, fallback)

// onSettled 시점의 mutation은 아직 pending으로 집계되므로 1이면 '내가 마지막'이다. 실패 시(force)엔 항상 다시 받는다.
const settleSessions = (
  queryClient: ReturnType<typeof useQueryClient>,
  force = false,
) => {
  if (
    !force &&
    queryClient.isMutating({ mutationKey: SESSION_MUTATION_PREFIX }) > 1
  )
    return
  invalidateSessionLists(queryClient)
}

type SessionsInfinite = InfiniteData<
  AxiosResponse<GetSessionsResponse>,
  string | undefined
>

export const useInfiniteSessions = () => {
  const { accessToken } = useAuth()
  return useInfiniteQuery({
    queryKey: SESSIONS_INFINITE_KEY,
    queryFn: ({ pageParam }) => getSessions(pageParam as string | undefined),
    getNextPageParam: nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!accessToken,
  })
}

export const useCreateSession = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSessionRequest) => createSession(data),
    onSuccess: () => {
      invalidateSessionLists(queryClient)
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
    mutationKey: [...SESSION_MUTATION_PREFIX, 'update'],
    mutationFn: ({
      sessionId,
      data,
    }: {
      sessionId: string
      data: UpdateSessionRequest
    }) => updateSession(sessionId, data),
    onMutate: async ({ sessionId, data }) => {
      if (data.title === undefined) return { snapshots: undefined }
      await cancelSessionLists(queryClient)
      const snapshots = optimisticallyPatchSession(
        queryClient,
        sessionId,
        (s) => ({
          ...s,
          title: data.title as string,
        }),
      )
      return { snapshots }
    },
    onError: (err, _vars, context) => {
      rollbackSnapshots(queryClient, context?.snapshots)
      showToast(getSessionErrorMessage(err, '대화 제목을 바꾸지 못했습니다.'))
    },
    onSettled: (_d, e) => settleSessions(queryClient, !!e),
  })
}

export const useDeleteSession = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [...SESSION_MUTATION_PREFIX, 'delete'],
    mutationFn: (sessionId: string) => deleteSession(sessionId),
    onMutate: async (sessionId) => {
      await cancelSessionLists(queryClient)

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
                items: page.data.data.items.filter(
                  (s) => s.session_id !== sessionId,
                ),
              },
            },
          })),
        }
      }

      snapshots.push([
        SESSIONS_INFINITE_KEY,
        queryClient.getQueryData(SESSIONS_INFINITE_KEY),
      ])
      queryClient.setQueryData<SessionsInfinite>(
        SESSIONS_INFINITE_KEY,
        dropSession,
      )

      for (const [key, data] of queryClient.getQueriesData<SessionsInfinite>({
        queryKey: PROJECT_SESSIONS_KEY,
      })) {
        snapshots.push([key, data])
        queryClient.setQueryData<SessionsInfinite>(key, dropSession)
      }

      return { snapshots }
    },
    // 후처리는 훅 레벨 콜백에 둔다. 낙관적 제거로 목록 행이 즉시 언마운트되므로
    // mutate(id, { onSuccess }) 처럼 호출부에 넘긴 콜백은 실행되지 않는다.
    onSuccess: (_d, sessionId) => clearChatCache(sessionId),
    onError: (err, _vars, context) => {
      rollbackSnapshots(queryClient, context?.snapshots)
      showToast(
        getSessionErrorMessage(
          err,
          '대화를 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.',
        ),
      )
    },
    onSettled: (_d, e) => settleSessions(queryClient, !!e),
  })
}

// 대화 삭제 진입점(사이드바·프로젝트 페이지)을 하나로 묶는다.
// 확인 → 보고 있던 대화면 먼저 화면을 옮김 → 서버 삭제.
export const useConfirmDeleteSession = () => {
  const { mutate } = useDeleteSession()
  const navigate = useNavigate()
  const location = useLocation()
  return async (session: {
    id: string
    title?: string | null
    projectId?: string | null
  }) => {
    const { text, isUntitled } = displaySessionTitle(session.title)
    const label = isUntitled ? '이 대화' : `'${text}' 대화`
    const ok = await confirm({
      title: `${label}를 삭제하시겠습니까?`,
      message: '대화의 모든 메시지가 함께 삭제되며 되돌릴 수 없습니다.',
      danger: true,
    })
    if (!ok) return
    const path = location.pathname
    const isOpen =
      path === `/chat/${session.id}` || path.endsWith(`/${session.id}`)
    if (isOpen)
      navigate(session.projectId ? `/projects/${session.projectId}` : '/chat')
    mutate(session.id)
  }
}

// 세션 목록 캐시(전역 ['sessions','infinite'] · 프로젝트별 ['projects','sessions',*])는
// 페이지 구조가 같으므로 한 헬퍼로 낙관적 수정을 적용한다.
const patchSessionInPages = <T extends SessionsInfinite>(
  old: T | undefined,
  sessionId: string,
  patch: (
    s: T['pages'][number]['data']['data']['items'][number],
  ) => T['pages'][number]['data']['data']['items'][number],
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
          items: page.data.data.items.map((s) =>
            s.session_id === sessionId ? patch(s) : s,
          ),
        },
      },
    })),
  }
}

// 전역 목록과 열려 있는 모든 프로젝트 세션 목록에 동시에 적용하고, 롤백용 스냅샷을 돌려준다.
const optimisticallyPatchSession = (
  queryClient: ReturnType<typeof useQueryClient>,
  sessionId: string,
  patch: (
    s: GetSessionsResponse['data']['items'][number],
  ) => GetSessionsResponse['data']['items'][number],
) => {
  const snapshots: [readonly unknown[], SessionsInfinite | undefined][] = []

  const global = queryClient.getQueryData<SessionsInfinite>(
    SESSIONS_INFINITE_KEY,
  )
  snapshots.push([SESSIONS_INFINITE_KEY, global])
  queryClient.setQueryData<SessionsInfinite>(SESSIONS_INFINITE_KEY, (old) =>
    patchSessionInPages(old, sessionId, patch),
  )

  const projectQueries = queryClient.getQueriesData<SessionsInfinite>({
    queryKey: PROJECT_SESSIONS_KEY,
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
    mutationKey: [...SESSION_MUTATION_PREFIX, 'favorite'],
    mutationFn: ({ sessionId, next }: { sessionId: string; next: boolean }) =>
      setFavorite(sessionId, { is_favorite: next }),

    onMutate: async ({ sessionId, next }) => {
      await cancelSessionLists(queryClient)
      const snapshots = optimisticallyPatchSession(
        queryClient,
        sessionId,
        (s) => ({
          ...s,
          is_favorite: next,
        }),
      )
      return { snapshots }
    },

    onError: (err, _vars, context) => {
      rollbackSnapshots(queryClient, context?.snapshots)
      showToast(getSessionErrorMessage(err, '즐겨찾기를 변경하지 못했습니다.'))
    },
    onSettled: (_d, e) => settleSessions(queryClient, !!e),
  })
}
