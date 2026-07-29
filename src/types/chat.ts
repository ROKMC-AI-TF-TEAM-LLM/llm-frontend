import type { Source, FileAttachment } from './index'

export interface MessageItem {
  message_id: string
  role: 'human' | 'ai'
  content: string
  created_at: string
  sources?: Source[]
  // 대화 이력의 각 메시지에 포함되는 첨부(sources와 동일 위치). 과거 대화에서도 다운로드 버튼 복원.
  attachments?: FileAttachment[]
  // 이 질문을 보낼 때 선택한 검색 도메인 코드(예: 'HR'). 전체 검색이면 없음/빈 문자열.
  // 서버가 저장해 돌려주므로 새로고침해도 도메인 태그가 복원된다(human 메시지에만 의미 있음).
  domain?: string | null
}

// 메시지 조회는 커서 기반 페이지네이션이다.
//  - items      : 이 페이지의 메시지들
//  - next_cursor: 다음(과거 방향) 페이지를 요청할 커서. 없으면 더 없음
//  - has_next   : 과거 메시지가 더 있는지
export interface MessageListData {
  items: MessageItem[]
  next_cursor: string | null
  has_next: boolean
}

export interface GetMessagesParams {
  cursor?: string | null
  /** 한 번에 가져올 메시지 수. 서버 파라미터 이름은 limit (기본 20, 1~100). */
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
