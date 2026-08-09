import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCapabilities } from '../api/services/capability'
import { useDocumentLookup } from './useDocument'
import { useAuth } from '../context/AuthContext'
import type { DomainCapability } from '../types/capability'

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

  const allDomains: DomainCapability[] | undefined = capQuery.data?.data.data.domains

  const domains = useMemo(() => {
    const caps = allDomains ?? []
    if (caps.length === 0) return []
    if (documents.length === 0) return []
    const present = new Set(documents.map((d) => d.domain).filter((v): v is string => !!v))
    return caps.filter((d) => present.has(d.code))
  }, [allDomains, documents])

  return { domains, isLoading: capQuery.isLoading || docsLoading }
}
