import { useEffect, useMemo } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getDocuments } from './api'
import { pickDocuments } from './utils'
import { useAuth } from '@/features/auth/useAuth'
import { logError } from '@/shared/utils/logError'
import type { DocumentItem } from './types'
import { getCapabilities } from '@/features/domains/api'
import type { DomainCapability } from '@/features/domains/types'

const LIMIT = 20
const LOOKUP_LIMIT = 100
const EMPTY_DOCUMENTS: DocumentItem[] = []

export const useDocumentLookup = (enabled: boolean) => {
  const { accessToken } = useAuth()
  const query = useInfiniteQuery({
    queryKey: ['document-lookup'],
    queryFn: ({ pageParam }) =>
      getDocuments({ offset: pageParam as number, limit: LOOKUP_LIMIT }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.data.data.has_more) return undefined
      return allPages.reduce(
        (acc, p) => acc + pickDocuments(p.data.data).length,
        0,
      )
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
      getDocuments({
        offset: pageParam as number,
        limit: LIMIT,
        ...(domain ? { domain } : {}),
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.data.data.has_more) return undefined
      return allPages.reduce(
        (acc, p) => acc + pickDocuments(p.data.data).length,
        0,
      )
    },
    initialPageParam: 0,
    enabled: !!accessToken,
    retry: 1,
  })
}

/** 채팅·문서 제작에서 고를 수 있는 분야: 서버가 알려준 분야 중 문서가 하나라도 있는 것 */
export const useDomainCapabilities = (enabled = true) => {
  const { accessToken } = useAuth()
  const capQuery = useQuery({
    queryKey: ['capabilities'],
    queryFn: getCapabilities,
    enabled: enabled && !!accessToken,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })

  const { documents, isLoading: docsLoading } = useDocumentLookup(enabled)

  const allDomains: DomainCapability[] | undefined =
    capQuery.data?.data.data.domains

  const domains = useMemo(() => {
    const caps = allDomains ?? []
    if (caps.length === 0) return []
    if (documents.length === 0) return []
    const present = new Set(
      documents.map((d) => d.domain).filter((v): v is string => !!v),
    )
    return caps.filter((d) => present.has(d.code))
  }, [allDomains, documents])

  return { domains, isLoading: capQuery.isLoading || docsLoading }
}
