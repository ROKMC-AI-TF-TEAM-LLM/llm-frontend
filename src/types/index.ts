export interface Source {
  name: string;
  page?: string | null;
}

export interface ChatItem {
  id: string;
  title: string;
  isActive?: boolean;
  /**
   * 즐겨찾기 여부. 서버의 SessionData.is_favorite 를 매핑한 값.
   *   - 매핑 지점: ui/layouts/ProtectedLayout.tsx (SessionData -> ChatItem)
   *   - 토글 API : PATCH /api/v1/sessions/{id}/favorite
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