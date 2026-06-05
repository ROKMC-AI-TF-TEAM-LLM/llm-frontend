import type { Source } from './index'

export interface MessageItem {
  role: 'human' | 'ai'
  content: string
  created_at: string
  sources?: Source[]
}

export interface MessageListData {
  session_id: string
  messages: MessageItem[]
}

// GetMessages
export type GetMessagesErrorCode = 'UNAUTHORIZED' | 'TOKEN_INVALID' | 'SESSION_NOT_FOUND' | 'SESSION_ACCESS_DENIED'
export interface GetMessagesResponse {
  success: boolean
  status_code: number
  data: MessageListData
  error: { code: GetMessagesErrorCode; detail: string } | null
}

// StreamMessage
export interface StreamMessageRequest {
  question: string
}
export type StreamMessageErrorCode = 'UNAUTHORIZED' | 'TOKEN_INVALID' | 'SESSION_NOT_FOUND' | 'SESSION_ACCESS_DENIED' | 'VALIDATION_ERROR'
