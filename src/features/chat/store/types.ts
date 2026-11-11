import { type Message, type StatusStep } from '../types'

export interface DomainSelection {
  code: string
  label: string
}

export interface ChatStore {
  sessionId: string
  messages: Message[]
  isStreaming: boolean
  isConnecting: boolean
  statusText: string | null
  statusSteps: StatusStep[]
  error: string | null
  isDeleted: boolean
  abortController: AbortController | null
  nextCursor: string | null
  hasMore: boolean
  isLoadingMore: boolean
  clearError: () => void
  resetDeleted: () => void
  abortStream: () => void
  connect: (sessionId: string) => Promise<void>
  disconnect: () => void
  loadMoreMessages: () => Promise<void>
  sendMessage: (
    content: string,
    domain?: DomainSelection,
    forceNotFirst?: boolean,
  ) => Promise<void>
  retryLastMessage: () => Promise<void>
  sendImageMessage: (filename: string, caption?: string) => void
  regenerateMessage: (assistantId: string) => Promise<void>
}
