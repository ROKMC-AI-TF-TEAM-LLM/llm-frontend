import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getDocuments, pickDocuments } from '../api/services/document'
import { useAuth } from '../context/AuthContext'
import { logError } from '../utils/logError'

const LIMIT = 20

// 채팅 출처(Source)는 이름만 주므로, 상세를 띄우려면 문서 목록에서 이름으로 찾아야 한다.
// 목록 전체를 한 번 받아 캐시해두고 매칭에만 쓴다(무한 스크롤 캐시와 별개 키).
// 서버가 limit 상한을 둘 수 있어 목록 조회와 같은 값(20의 배수)으로 보수적으로 잡는다.
const LOOKUP_LIMIT = 100

/**
 * 출처 이름 매칭용 문서 목록.
 * enabled=false면 요청하지 않는다 — 출처를 실제로 클릭(펼침)할 때만 불러오기 위함.
 * queryKey가 고정이라 여러 메시지의 출처가 동시에 켜져도 요청은 한 번만 나간다.
 */
export const useDocumentLookup = (enabled: boolean) => {
  const { accessToken } = useAuth()
  const query = useQuery({
    // useInfiniteDocuments가 ['documents', domain]을 쓰므로 키를 완전히 분리한다.
    // (같은 키를 useQuery/useInfiniteQuery가 공유하면 캐시 구조가 달라 깨진다)
    queryKey: ['document-lookup'],
    queryFn: () => getDocuments({ offset: 0, limit: LOOKUP_LIMIT }),
    enabled: enabled && !!accessToken,
    staleTime: 5 * 60 * 1000, // 문서 목록은 자주 안 바뀐다
    retry: 1,
  })

  if (query.error) logError('useDocumentLookup', query.error)

  return {
    documents: query.data ? pickDocuments(query.data.data.data) : [],
    isLoading: query.isLoading,
  }
}

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
