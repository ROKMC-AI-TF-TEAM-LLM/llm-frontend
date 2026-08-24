import { useEffect } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getDocuments, pickDocuments } from '../api/services/document'
import { useAuth } from '../context/AuthContext'
import { logError } from '../utils/logError'

const LIMIT = 20
const LOOKUP_LIMIT = 100

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
  })

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (query.error) logError('useDocumentLookup', query.error)

  return {
    documents: query.data ? query.data.pages.flatMap((p) => pickDocuments(p.data.data)) : [],
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
