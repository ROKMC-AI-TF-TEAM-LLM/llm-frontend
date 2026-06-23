import { useQuery } from '@tanstack/react-query'
import { getHealth } from '../api/services/health'

export type ServerStatus = 'checking' | 'ok' | 'error'

export function useServerStatus(): ServerStatus {
  const { data, isError, isPending } = useQuery({
    queryKey: ['server-health'],
    queryFn: getHealth,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    staleTime: 0,
    refetchInterval: (query) => {
      const h = query.state.data?.data?.data
      const ok = query.state.status !== 'error' && !!h?.db && !!h?.llm_server
      return ok ? false : 20_000
    },
  })

  if (isPending) return 'checking'
  if (isError || !data) return 'error'

  const { db, llm_server } = data.data.data
  return db && llm_server ? 'ok' : 'error'
}