import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelDocGenJob,
  createDocGenJob,
  deleteDocGenJob,
  getDocGenJobs,
  getDocGenTemplates,
  retryDocGenJob,
} from '../api/services/docgen'
import type { CreateDocGenJobFields } from '../types/docgen'
import { isJobActive } from '../utils/docgen'
import { useAuth } from '../context/AuthContext'

const JOBS_KEY = ['docgen', 'jobs']
/** 대기·생성 중인 작업이 있는 동안 목록을 다시 받는 간격 */
const POLL_MS = 1000

/** 서버가 내려주는 양식 목록 */
export const useDocGenTemplates = () => {
  const { accessToken } = useAuth()
  const query = useQuery({
    queryKey: ['docgen', 'templates'],
    queryFn: getDocGenTemplates,
    enabled: !!accessToken,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
  return { templates: query.data?.data.data.templates ?? [], isLoading: query.isLoading }
}

/** 내 생성 작업 목록. 진행 중인 작업이 있으면 계속 갱신한다 */
export const useDocGenJobs = () => {
  const { accessToken } = useAuth()
  const query = useQuery({
    queryKey: JOBS_KEY,
    queryFn: getDocGenJobs,
    enabled: !!accessToken,
    retry: 1,
    refetchInterval: (q) => {
      if (q.state.status === 'error') return false
      return (q.state.data?.data.data.jobs ?? []).some(isJobActive) ? POLL_MS : false
    },
  })
  return { jobs: query.data?.data.data.jobs ?? [], isLoading: query.isLoading, isError: query.isError }
}

/* 작업을 바꾸는 요청. 성공하면 목록을 다시 받는다 */
const useInvalidateJobs = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: JOBS_KEY })
}

export const useCreateDocGenJob = () => {
  const onSuccess = useInvalidateJobs()
  return useMutation({ mutationFn: (fields: CreateDocGenJobFields) => createDocGenJob(fields), onSuccess })
}

export const useCancelDocGenJob = () => {
  const onSuccess = useInvalidateJobs()
  return useMutation({ mutationFn: (jobId: string) => cancelDocGenJob(jobId), onSuccess })
}

export const useRetryDocGenJob = () => {
  const onSuccess = useInvalidateJobs()
  return useMutation({ mutationFn: (jobId: string) => retryDocGenJob(jobId), onSuccess })
}

export const useDeleteDocGenJob = () => {
  const onSuccess = useInvalidateJobs()
  return useMutation({ mutationFn: (jobId: string) => deleteDocGenJob(jobId), onSuccess })
}
