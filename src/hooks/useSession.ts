import { useMemo } from 'react'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import type { AxiosResponse } from 'axios'
import { getSessions, createSession, searchSessions, updateSession, setFavorite, deleteSession } from '../api/services/session'
import type {
  CreateSessionRequest,
  SearchSessionsRequest,
  UpdateSessionRequest,
  GetSessionsResponse,
  SessionData,
} from '../types/session'
import { useAuth } from '../context/AuthContext'

// useInfiniteSessions 캐시의 실제 형태 (페이지 = axios 응답)
type SessionsInfinite = InfiniteData<AxiosResponse<GetSessionsResponse>, string | undefined>

// 목록은 즐겨찾기 여부로 나뉘어 각각 별도 캐시를 갖는다.
//  - sessionsKey(true)  : 즐겨찾기 섹션
//  - sessionsKey(false) : 최근 대화 섹션(즐겨찾기 제외)
// 두 키 모두 ['sessions', ...] 프리픽스라 invalidateQueries(['sessions'])로 한 번에 무효화된다.
const sessionsKey = (isFavorite?: boolean) => ['sessions', 'infinite', isFavorite ?? 'all'] as const
const FAVORITES_KEY = sessionsKey(true)
const OTHERS_KEY = sessionsKey(false)

/**
 * 세션 목록(커서 무한스크롤).
 * @param isFavorite true=즐겨찾기만 / false=즐겨찾기 제외 / 생략=전체
 */
export const useInfiniteSessions = (isFavorite?: boolean) => {
  const { accessToken } = useAuth()
  return useInfiniteQuery({
    queryKey: sessionsKey(isFavorite),
    queryFn: ({ pageParam }) => getSessions(pageParam as string | undefined, 20, isFavorite),
    getNextPageParam: (lastPage) => {
      const data = lastPage.data.data
      return data.has_next && data.next_cursor ? data.next_cursor : undefined
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!accessToken,
  })
}

/**
 * 두 섹션(즐겨찾기 + 최근)을 합친 전체 세션.
 * 세션 하나를 id로 찾아야 하는 화면(채팅 제목, 검색 페이지의 최근 목록)에서 쓴다.
 * 사이드바가 이미 두 쿼리를 채워두므로 대개 캐시 히트라 추가 요청이 없다.
 */
export const useAllSessions = () => {
  const favorites = useInfiniteSessions(true)
  const others = useInfiniteSessions(false)

  const items = useMemo(() => {
    const merged: SessionData[] = [
      ...(favorites.data?.pages ?? []).flatMap((p) => p.data.data.items),
      ...(others.data?.pages ?? []).flatMap((p) => p.data.data.items),
    ]
    // 두 목록 모두 updated_at 내림차순이므로 합친 뒤 같은 기준으로 재정렬하면 된다.
    return merged.sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
  }, [favorites.data, others.data])

  return {
    items,
    isLoading: favorites.isLoading || others.isLoading,
    isError: favorites.isError || others.isError,
  }
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

// ── 즐겨찾기 토글용 캐시 조작 헬퍼 ───────────────────────────────
// 목록이 두 캐시로 나뉘므로, 토글은 '한쪽에서 빼서 다른 쪽에 넣는' 이동이 된다.

// 캐시에서 세션을 빼고, 빼낸 항목을 함께 돌려준다(없으면 removed=undefined).
const removeSession = (data: SessionsInfinite | undefined, sessionId: string) => {
  if (!data) return { next: data, removed: undefined as SessionData | undefined }
  let removed: SessionData | undefined
  const pages = data.pages.map((page) => {
    const items = page.data.data.items.filter((s) => {
      if (s.session_id !== sessionId) return true
      removed = s
      return false
    })
    return { ...page, data: { ...page.data, data: { ...page.data.data, items } } }
  })
  return { next: { ...data, pages }, removed }
}

// updated_at 내림차순을 유지하며 세션을 끼워 넣는다.
// 즐겨찾기 토글은 updated_at을 바꾸지 않으므로(스웨거 명시) 원래 순서 그대로 자리를 찾는다.
const insertSession = (data: SessionsInfinite | undefined, session: SessionData) => {
  if (!data || data.pages.length === 0) return data
  const t = Date.parse(session.updated_at)
  const pages = [...data.pages]
  for (let p = 0; p < pages.length; p++) {
    const items = pages[p].data.data.items
    const idx = items.findIndex((s) => Date.parse(s.updated_at) <= t)
    const isLastPage = p === pages.length - 1
    if (idx !== -1 || isLastPage) {
      const at = idx === -1 ? items.length : idx
      const nextItems = [...items.slice(0, at), session, ...items.slice(at)]
      pages[p] = {
        ...pages[p],
        data: { ...pages[p].data, data: { ...pages[p].data.data, items: nextItems } },
      }
      return { ...data, pages }
    }
  }
  return data
}

/**
 * 즐겨찾기 토글 — PATCH /sessions/{id}/favorite (제목 수정 PATCH와 별개인 전용 엔드포인트).
 * 낙관적 업데이트: 두 캐시 사이로 항목을 즉시 이동시키고, 실패하면 둘 다 롤백한다.
 */
export const useToggleFavorite = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, next }: { sessionId: string; next: boolean }) =>
      setFavorite(sessionId, { is_favorite: next }),

    onMutate: async ({ sessionId, next }) => {
      // 진행 중이던 목록 refetch가 나중에 도착해 낙관적 변경을 덮어쓰는 것을 막는다.
      await queryClient.cancelQueries({ queryKey: ['sessions'] })

      const prevFavorites = queryClient.getQueryData<SessionsInfinite>(FAVORITES_KEY)
      const prevOthers = queryClient.getQueryData<SessionsInfinite>(OTHERS_KEY)

      // next=true  : 최근 → 즐겨찾기 로 이동
      // next=false : 즐겨찾기 → 최근 으로 이동
      const fromKey = next ? OTHERS_KEY : FAVORITES_KEY
      const toKey = next ? FAVORITES_KEY : OTHERS_KEY

      const { next: fromNext, removed } = removeSession(
        queryClient.getQueryData<SessionsInfinite>(fromKey),
        sessionId,
      )
      if (removed) {
        queryClient.setQueryData(fromKey, fromNext)
        queryClient.setQueryData<SessionsInfinite>(toKey, (old) =>
          insertSession(old, { ...removed, is_favorite: next }),
        )
      }

      return { prevFavorites, prevOthers }
    },

    // 실패하면 두 캐시 모두 스냅샷으로 되돌린다.
    onError: (_err, _vars, context) => {
      if (context?.prevFavorites) queryClient.setQueryData(FAVORITES_KEY, context.prevFavorites)
      if (context?.prevOthers) queryClient.setQueryData(OTHERS_KEY, context.prevOthers)
    },

    // 성공/실패 무관하게 서버 기준으로 재동기화(두 목록 모두).
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}
