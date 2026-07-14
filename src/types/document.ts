// 문서(RAG 벡터스토어에 인덱싱된 문서) API 타입.
// GET /api/v1/documents — offset 기반 무한 스크롤 + domain 필터 지원.

export interface DocumentItem {
  name: string
  type?: string | null              // 문서 종류 (예: 규정, 지침)
  domain?: string | null            // 도메인 코드 (예: HR, MANUAL) — GET /capabilities 참조
  visibility?: string | null        // 공개 범위
  owning_department?: string | null // 소유 부서
  applied_at?: string | null        // 적용일 (ISO 8601)
}

// 백엔드 응답 키가 환경에 따라 items / documents 로 다를 수 있어 둘 다 옵셔널로 둔다.
export interface DocumentListData {
  items?: DocumentItem[]
  documents?: DocumentItem[]
  total?: number
  offset?: number
  limit?: number
  has_more?: boolean
}

export interface GetDocumentsParams {
  offset?: number
  limit?: number
  /** 도메인 필터 (예: HR, MANUAL). 미지정이면 전체 조회. */
  domain?: string
}

export type GetDocumentsErrorCode = 'UNAUTHORIZED' | 'TOKEN_INVALID' | 'LLM_SERVER_ERROR'
export interface GetDocumentsResponse {
  success: boolean
  status_code: number
  data: DocumentListData
  error: { code: GetDocumentsErrorCode; detail: string } | null
}
