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
