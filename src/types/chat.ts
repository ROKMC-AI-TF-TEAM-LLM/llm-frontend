import type { Source } from './index'

export interface MessageItem {
  message_id: string
  role: 'human' | 'ai'
  content: string
  created_at: string
  sources?: Source[]
}

export interface MessageListData {
  session_id: string
  messages: MessageItem[]
}

export type GetMessagesErrorCode = 'UNAUTHORIZED' | 'TOKEN_INVALID' | 'SESSION_NOT_FOUND' | 'SESSION_ACCESS_DENIED'
export interface GetMessagesResponse {
  success: boolean
  status_code: number
  data: MessageListData
  error: { code: GetMessagesErrorCode; detail: string } | null
}

export interface StreamMessageRequest {
  question: string
  /** 검색을 특정 도메인으로 한정(예: HR). '전체' 검색이면 생략. GET /capabilities 참조. */
  domain?: string
}
export type StreamMessageErrorCode = 'UNAUTHORIZED' | 'TOKEN_INVALID' | 'SESSION_NOT_FOUND' | 'SESSION_ACCESS_DENIED' | 'VALIDATION_ERROR'

export type DeleteMessageErrorCode = 'UNAUTHORIZED' | 'TOKEN_INVALID' | 'MESSAGE_NOT_FOUND' | 'SESSION_ACCESS_DENIED'
export interface DeleteMessageResponse {
  success: boolean
  status_code: number
  data: null
  error: { code: DeleteMessageErrorCode; detail: string } | null
}

// 재생성은 SSE(text/event-stream)로 응답하므로 일반 JSON 응답 타입은 없다.
// SSE error 이벤트로 반환되는 코드: MESSAGE_NOT_FOUND / INVALID_MESSAGE_ROLE / SESSION_ACCESS_DENIED
export type RegenerateMessageErrorCode = 'MESSAGE_NOT_FOUND' | 'INVALID_MESSAGE_ROLE' | 'SESSION_ACCESS_DENIED' | 'UNAUTHORIZED'
