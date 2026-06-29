export interface DocumentItem {
  name: string
  type?: string | null
  applied_at?: string | null
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
}
export type GetDocumentsErrorCode = 'UNAUTHORIZED' | 'TOKEN_INVALID' | 'LLM_SERVER_ERROR'
export interface GetDocumentsResponse {
  success: boolean
  status_code: number
  data: DocumentListData
  error: { code: GetDocumentsErrorCode; detail: string } | null
}
