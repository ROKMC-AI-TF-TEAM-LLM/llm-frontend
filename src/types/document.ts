export interface DocumentItem {
  name: string
  type?: string | null
  domain?: string | null
  visibility?: string | null
  owning_department?: string | null
  applied_at?: string | null
}

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
  domain?: string
}

export type GetDocumentsErrorCode = 'UNAUTHORIZED' | 'TOKEN_INVALID' | 'LLM_SERVER_ERROR'

export interface GetDocumentsResponse {
  success: boolean
  status_code: number
  data: DocumentListData
  error: { code: GetDocumentsErrorCode; detail: string } | null
}
