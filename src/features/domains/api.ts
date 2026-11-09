import { backendApi } from '@/lib/axios'
import type { GetCapabilitiesResponse } from './types'

export const getCapabilities = () =>
  backendApi.get<GetCapabilitiesResponse>('/api/v1/capabilities')
