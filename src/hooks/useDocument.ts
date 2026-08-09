import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getDocuments, pickDocuments } from '../api/services/document'
import { useAuth } from '../context/AuthContext'
import { logError } from '../utils/logError'

const LIMIT = 20
const LOOKUP_LIMIT = 100

export const useDocumentLookup = (enabled: boolean) => {
  const { accessToken } = useAuth()
  const query = useQuery({
    queryKey: ['document-lookup'],
    queryFn: () => getDocuments({ offset: 0, limit: LOOKUP_LIMIT }),
    enabled: enabled && !!accessToken,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  if (query.error) logError('useDocumentLookup', query.error)

  return {
    documents: query.data ? pickDocuments(query.data.data.data) : [],
    isLoading: query.isLoading,
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
