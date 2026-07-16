import { backendApi } from '../lib/axios'
import type { GetCapabilitiesResponse } from '../../types/capability'

// 채팅 요청에 넣을 수 있는 도메인·툴 목록. 자주 바뀌지 않는다.
export const getCapabilities = () =>
  backendApi.get<GetCapabilitiesResponse>('/api/v1/capabilities')
