import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCapabilities } from '../api/services/capability'
import { useDocumentLookup } from './useDocument'
import { useAuth } from '../context/AuthContext'
import type { DomainCapability } from '../types/capability'

/**
 * 채팅에서 쓸 도메인 목록.
 *
 * capabilities(GET /capabilities)는 '채팅에 넣을 수 있는 도메인' 전체를 준다 —
 * 실제로 그 도메인의 문서가 있는지는 별개다. 그래서 실제 문서 목록의 domain 값과
 * 교집합해서, '문서가 존재하는 도메인'만 노출한다(없는 도메인은 선택지에 안 뜬다).
 *
 * enabled=false면 문서 목록을 조회하지 않는다 — 드롭다운을 열 때만 부르기 위함.
 * (교집합 대상이 아직 없으면 빈 목록을 반환 → 로딩 끝나면 채워진다)
 */
export const useDomainCapabilities = (enabled = true) => {
  const { accessToken } = useAuth()
  const capQuery = useQuery({
    queryKey: ['capabilities'],
    queryFn: getCapabilities,
    enabled: enabled && !!accessToken,
    staleTime: 10 * 60 * 1000, // 도메인/툴 목록은 거의 안 바뀐다
    retry: 1,
  })

  const { documents } = useDocumentLookup(enabled)

  const allDomains: DomainCapability[] | undefined = capQuery.data?.data.data.domains

  const domains = useMemo(() => {
    const caps = allDomains ?? []
    if (caps.length === 0) return []
    // 문서 목록을 아직 못 받았으면(로딩 중) 섣불리 다 숨기지 말고 빈 목록을 유지한다.
    if (documents.length === 0) return []
    const present = new Set(documents.map((d) => d.domain).filter((v): v is string => !!v))
    return caps.filter((d) => present.has(d.code))
  }, [allDomains, documents])

  return { domains, isLoading: capQuery.isLoading }
}
