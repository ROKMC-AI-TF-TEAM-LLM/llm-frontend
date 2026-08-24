import type { Source, FileAttachment } from './index'

export interface MessageItem {
  message_id: string
  role: 'human' | 'ai'
  content: string
  created_at: string
  sources?: Source[]
  attachments?: FileAttachment[]
  domain?: string | null
}

export interface MessageListData {
  items: MessageItem[]
  next_cursor: string | null
  has_next: boolean
}

export interface GetMessagesParams {
  cursor?: string | null
  limit?: number
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

export type RegenerateMessageErrorCode = 'MESSAGE_NOT_FOUND' | 'INVALID_MESSAGE_ROLE' | 'SESSION_ACCESS_DENIED' | 'UNAUTHORIZED'
