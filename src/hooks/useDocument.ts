import { useInfiniteQuery } from '@tanstack/react-query'
import { getDocuments } from '../api/services/document'
import { useAuth } from '../context/AuthContext'

const LIMIT = 20

export const useInfiniteDocuments = () => {
  const { accessToken } = useAuth()
  return useInfiniteQuery({
    queryKey: ['documents'],
    queryFn: ({ pageParam }) => getDocuments({ offset: pageParam as number, limit: LIMIT }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.data.data.has_more) return undefined
      return allPages.reduce((acc, p) => acc + p.data.data.documents.length, 0)
    },
    initialPageParam: 0,
    enabled: !!accessToken,
  })
}
