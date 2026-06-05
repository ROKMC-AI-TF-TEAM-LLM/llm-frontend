import { useQuery } from '@tanstack/react-query'
import { getHealth } from '../api/services/health'

export type ServerStatus = 'checking' | 'ok' | 'error'

export function useServerStatus(): ServerStatus {
  const { data, isError, isPending } = useQuery({
    queryKey: ['server-health'],
    queryFn: getHealth,
    refetchInterval: 30_000,
    retry: false,
    staleTime: 25_000,
  })

  if (isPending) return 'checking'
  if (isError || !data) return 'error'

  const { db, llm_server } = data.data.data
  return db && llm_server ? 'ok' : 'error'
}
