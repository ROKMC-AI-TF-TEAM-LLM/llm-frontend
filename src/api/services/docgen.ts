import { backendApi } from '../lib/axios'
import type {
  CreateDocGenJobFields,
  CreateDocGenJobResponse,
  DeleteDocGenJobResponse,
  GetDocGenJobResponse,
  GetDocGenJobsResponse,
  GetDocGenTemplatesResponse,
} from '../../types/docgen'

// TODO(백엔드 연결): 엔드포인트 경로는 가정값이다. 명세 확인 후 맞춘다.
// mock 모드(`npm run dev:mock`)에서는 src/mock/handlers/docgen.ts가 응답한다.
const BASE = '/api/v1/docgen'

export const getDocGenTemplates = () =>
  backendApi.get<GetDocGenTemplatesResponse>(`${BASE}/templates`)

export const getDocGenJobs = () =>
  backendApi.get<GetDocGenJobsResponse>(`${BASE}/jobs`, { timeout: 30000 })

export const getDocGenJob = (jobId: string) =>
  backendApi.get<GetDocGenJobResponse>(`${BASE}/jobs/${jobId}`)

export const createDocGenJob = (fields: CreateDocGenJobFields) =>
  backendApi.post<CreateDocGenJobResponse>(`${BASE}/jobs`, fields)

export const cancelDocGenJob = (jobId: string) =>
  backendApi.post<GetDocGenJobResponse>(`${BASE}/jobs/${jobId}/cancel`)

export const retryDocGenJob = (jobId: string) =>
  backendApi.post<GetDocGenJobResponse>(`${BASE}/jobs/${jobId}/retry`)

export const deleteDocGenJob = (jobId: string) =>
  backendApi.delete<DeleteDocGenJobResponse>(`${BASE}/jobs/${jobId}`)
