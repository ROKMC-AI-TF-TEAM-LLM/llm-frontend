import { useState, type KeyboardEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelDocGenJob,
  createDocGenJob,
  deleteDocGenJob,
  getDocGenJobs,
  getDocGenTemplates,
  retryDocGenJob,
} from './api'
import type { CreateDocGenJobFields, DocGenJob, DocGenOutputFormat } from './types'
import { isJobActive } from './utils'
import { useAuth } from '@/features/auth/useAuth'
import { useDomainCapabilities } from '@/features/documents/hooks'
import { showToast } from '@/shared/store/toastStore'

/* ───────── 서버 데이터 (React Query) ───────── */

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

/* ───────── 화면 훅 ───────── */

/** 입력창 값과 보내기. 분야는 capabilities, 양식은 서버 양식 목록에서 고른다 */
export const useComposer = () => {
  const [prompt, setPrompt] = useState('')
  const [templateId, setTemplateId] = useState<string | null>(null)
  /** '' = 전체 분야 */
  const [domain, setDomain] = useState('')
  const [format, setFormat] = useState<DocGenOutputFormat | null>(null)
  const { templates } = useDocGenTemplates()
  const { domains } = useDomainCapabilities()
  const create = useCreateDocGenJob()
  const template = templates.find((t) => t.template_id === templateId)

  const pickTemplate = (id: string) => {
    setTemplateId(id)
    if (!format) setFormat(templates.find((t) => t.template_id === id)?.default_format ?? null)
  }

  /** 요청을 보내고 만들어진 작업을 돌려준다. 보내지 못하면 알림을 띄우고 null */
  const submit = async (): Promise<DocGenJob | null> => {
    if (!template || !prompt.trim()) return null
    try {
      const res = await create.mutateAsync({
        prompt: prompt.trim(),
        template_id: template.template_id,
        domain: domain || null,
        output_format: format ?? template.default_format,
        length: 'NORMAL',
      })
      return res.data.data
    } catch {
      showToast('문서 생성 요청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.')
      return null
    }
  }

  return {
    prompt, setPrompt, templateId, pickTemplate, template, templates,
    domain, setDomain, domains, format, setFormat,
    canSubmit: !!prompt.trim() && !!template && !create.isPending,
    submit,
  }
}
export type Composer = ReturnType<typeof useComposer>

/**
 * 화면을 연 뒤 새로 생긴 작업인지. 처음 받아 온 목록을 기준으로 삼고,
 * 그 뒤에 나타난 줄에만 등장 움직임을 준다.
 */
export const useFreshIds = (ids: string[], ready: boolean) => {
  const [baseline, setBaseline] = useState<Set<string> | null>(null)
  if (ready && baseline === null) setBaseline(new Set(ids))
  return (id: string) => baseline !== null && !baseline.has(id)
}

/** 진행 상황 목록에서 누를 수 있는 줄 */
export const selectable = (onSelect: () => void) => ({
  role: 'button' as const,
  tabIndex: 0,
  onClick: onSelect,
  onKeyDown: (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect()
    }
  },
})
