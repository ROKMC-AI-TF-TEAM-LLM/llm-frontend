import { backendApi } from '../lib/axios'
import { docgenMock } from './docgenMock'
import type {
  CreateDocGenJobFields,
  CreateDocGenJobResponse,
  DeleteDocGenJobResponse,
  GetDocGenJobResponse,
  GetDocGenJobsResponse,
  GetDocGenTemplatesResponse,
} from '../../types/docgen'

// TODO(백엔드 연결): 엔드포인트 경로는 가정값이다. 명세 확인 후 맞추고 USE_MOCK을 끈다.
// 시그니처와 응답 모양은 진짜 API와 같게 맞춰 두었으므로 훅·컴포넌트는 바꿀 필요가 없다.
const USE_MOCK = import.meta.env.VITE_DOCGEN_MOCK !== 'false'

const BASE = '/api/v1/docgen'

export const getDocGenTemplates = () =>
  USE_MOCK
    ? docgenMock.getTemplates()
    : backendApi.get<GetDocGenTemplatesResponse>(`${BASE}/templates`)

export const getDocGenJobs = () =>
  USE_MOCK
    ? docgenMock.getJobs()
    : backendApi.get<GetDocGenJobsResponse>(`${BASE}/jobs`, { timeout: 30000 })

export const getDocGenJob = (jobId: string) =>
  USE_MOCK
    ? docgenMock.getJob(jobId)
    : backendApi.get<GetDocGenJobResponse>(`${BASE}/jobs/${jobId}`)

export const createDocGenJob = (fields: CreateDocGenJobFields, files: File[]) => {
  if (USE_MOCK) return docgenMock.createJob(fields, files)
  const form = new FormData()
  form.append('prompt', fields.prompt)
  form.append('template_id', fields.template_id)
  if (fields.domain) form.append('domain', fields.domain)
  form.append('output_format', fields.output_format)
  form.append('length', fields.length)
  files.forEach((f) => form.append('files', f))
  return backendApi.post<CreateDocGenJobResponse>(`${BASE}/jobs`, form, {
    headers: { 'Content-Type': undefined },
    timeout: 120000,
  })
}

export const cancelDocGenJob = (jobId: string) =>
  USE_MOCK
    ? docgenMock.cancelJob(jobId)
    : backendApi.post<GetDocGenJobResponse>(`${BASE}/jobs/${jobId}/cancel`)

export const retryDocGenJob = (jobId: string) =>
  USE_MOCK
    ? docgenMock.retryJob(jobId)
    : backendApi.post<GetDocGenJobResponse>(`${BASE}/jobs/${jobId}/retry`)

export const deleteDocGenJob = (jobId: string) =>
  USE_MOCK
    ? docgenMock.deleteJob(jobId)
    : backendApi.delete<DeleteDocGenJobResponse>(`${BASE}/jobs/${jobId}`)
