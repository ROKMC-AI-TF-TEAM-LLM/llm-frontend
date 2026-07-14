import { useInfiniteQuery } from '@tanstack/react-query'
import { getDocuments, pickDocuments } from '../api/services/document'
import { useAuth } from '../context/AuthContext'

const LIMIT = 20

/**
 * 문서 무한 스크롤.
 * domain을 넘기면 서버가 그 도메인만 필터링해서 준다(GET /documents?domain=HR).
 * domain이 바뀌면 queryKey가 바뀌므로 자동으로 처음부터 다시 조회된다.
 */
export const useInfiniteDocuments = (domain?: string) => {
  const { accessToken } = useAuth()
  return useInfiniteQuery({
    queryKey: ['documents', domain ?? 'all'],
    queryFn: ({ pageParam }) =>
      getDocuments({ offset: pageParam as number, limit: LIMIT, ...(domain ? { domain } : {}) }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.data.data.has_more) return undefined
      return allPages.reduce((acc, p) => acc + pickDocuments(p.data.data).length, 0)
    },
    initialPageParam: 0,
    enabled: !!accessToken,
    retry: 1,
  })
}
