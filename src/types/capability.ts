// GET /api/v1/capabilities — 채팅 스트리밍 요청의 domain·tool 필드에 넣을 수 있는 값 목록.

export interface DomainCapability {
  code: string
  label: string
}

export interface ToolCapability {
  code: string
  description: string
  forcible: boolean
}

export interface CapabilitiesData {
  domains: DomainCapability[]
  tools: ToolCapability[]
}

export type GetCapabilitiesErrorCode = 'UNAUTHORIZED' | 'TOKEN_INVALID' | 'LLM_SERVER_ERROR'

export interface GetCapabilitiesResponse {
  success: boolean
  status_code: number
  data: CapabilitiesData
  error: { code: GetCapabilitiesErrorCode; detail: string } | null
}
