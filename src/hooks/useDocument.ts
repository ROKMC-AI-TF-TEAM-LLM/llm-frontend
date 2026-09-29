import { useEffect } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getDocuments, pickDocuments } from '../api/services/document'
import { useAuth } from '../context/AuthContext'
import { logError } from '../utils/logError'
import type { DocumentItem } from '../types/document'

const LIMIT = 20
const LOOKUP_LIMIT = 100
const EMPTY_DOCUMENTS: DocumentItem[] = []

export const useDocumentLookup = (enabled: boolean) => {
  const { accessToken } = useAuth()
  const query = useInfiniteQuery({
    queryKey: ['document-lookup'],
    queryFn: ({ pageParam }) => getDocuments({ offset: pageParam as number, limit: LOOKUP_LIMIT }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.data.data.has_more) return undefined
      return allPages.reduce((acc, p) => acc + pickDocuments(p.data.data).length, 0)
    },
    initialPageParam: 0,
    enabled: enabled && !!accessToken,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    // select 결과는 React Query가 캐싱하므로, 이 훅을 메시지마다 호출해도
    // documents 참조가 렌더마다 새로 만들어지지 않는다.
    select: (data) => data.pages.flatMap((p) => pickDocuments(p.data.data)),
  })

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (query.error) logError('useDocumentLookup', query.error)

  return {
    documents: query.data ?? EMPTY_DOCUMENTS,
    isLoading: query.isLoading || query.isFetchingNextPage,
  }
}

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
