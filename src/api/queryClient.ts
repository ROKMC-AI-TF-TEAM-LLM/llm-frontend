import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import { logError } from '../utils/logError'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => logError(`query:${String(query.queryKey?.[0] ?? 'unknown')}`, error),
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) =>
      logError(`mutation:${String(mutation.options.mutationKey?.[0] ?? 'unknown')}`, error),
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
})
