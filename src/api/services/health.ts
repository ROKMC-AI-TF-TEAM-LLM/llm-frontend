import { backendApi } from '../lib/axios'

export interface HealthData {
  db: boolean
  llm_server: boolean
}

export interface HealthResponse {
  success: boolean
  status_code: number
  data: HealthData
  error: { code: string; detail: string } | null
}

export const getHealth = () =>
  backendApi.get<HealthResponse>('/api/v1/health')
