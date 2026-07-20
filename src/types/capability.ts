// GET /api/v1/capabilities — 채팅 스트리밍 요청의 domain·tool 필드에 넣을 수 있는 값 목록.
// 프론트엔드 도메인 탭/검색 모드 UI의 데이터 소스다.
// (문서에 없는 도메인은 서버가 애초에 내려주지 않으므로, 프론트는 이 목록만 그대로 보여주면 된다)

export interface DomainCapability {
  code: string   // 스트리밍 요청 domain 필드에 넣는 값 (예: HR)
  label: string  // 화면에 보여줄 한글 이름 (예: 인사·복지)
}

export interface ToolCapability {
  code: string
  description: string
  forcible: boolean // true면 tool 필드로 강제 지정 가능
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
