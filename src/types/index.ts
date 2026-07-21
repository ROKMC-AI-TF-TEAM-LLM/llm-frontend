export interface Source {
  name: string;
  page?: string | null;
}

// SSE 'file' 이벤트로 오는 첨부(예: HWP 내보내기 결과). 미들웨어가 자체 URL을 준다.
// { "type": "file", "name": "MARS_답변_....hwpx", "url": "/files/...", "tool": "HWP_EXPORT" }
export interface FileAttachment {
  name: string;
  url: string;
  tool?: string | null;
}

export interface ChatItem {
  id: string;
  title: string;
  isActive?: boolean;
  /**
   * 즐겨찾기 여부.
   * TODO(API): 백엔드 필드 확정 시 매핑만 맞추면 된다.
   *   - 매핑 지점: ui/layouts/ProtectedLayout.tsx (SessionData -> ChatItem)
   *   - 서버 타입 : types/session.ts 의 SessionData.is_favorite
   */
  isFavorite?: boolean;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  role?: 'admin' | 'user';
  createdAt?: string;
}

export interface UserMessage {
  id: string;
  role: 'user';
  type: 'text';
  content: string;
  createdAt?: string;
  /**
   * 이 질문을 보낼 때 선택했던 도메인. 전체 검색이면 없음.
   * code는 재생성 폴백(재전송) 시 서버 domain 필드 복원용, label은 말풍선 위 태그 표시용.
   */
  domainCode?: string;
  domainLabel?: string;
}

export interface AssistantMessage {
  id: string;
  role: 'assistant';
  type: 'text';
  content: string;
  status?: 'streaming' | 'done' | 'interrupted';
  sources?: Source[];
  files?: FileAttachment[];
  createdAt?: string;
}

export interface ImageMessage {
  id: string;
  role: 'user' | 'assistant';
  type: 'image';
  filename: string;
  caption?: string;
  createdAt?: string;
}


export interface RagDocument {
  id: string
  title: string
  fileType: 'PDF' | 'HWP' | string
  preview: string
}

export type Message = UserMessage | AssistantMessage | ImageMessage;
export type MessageRole = 'user' | 'assistant';