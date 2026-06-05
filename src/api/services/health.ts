import { backendApi } from '../lib/axios'

interface HealthData {
  db: boolean
  llm_server: boolean
}

export const getHealth = () =>
  backendApi.get<{ data: HealthData }>('/api/v1/health')