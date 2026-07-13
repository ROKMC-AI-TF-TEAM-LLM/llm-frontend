export interface Source {
  name: string;
  page?: string | null;
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
}

export interface AssistantMessage {
  id: string;
  role: 'assistant';
  type: 'text';
  content: string;
  status?: 'streaming' | 'done' | 'interrupted';
  sources?: Source[];
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