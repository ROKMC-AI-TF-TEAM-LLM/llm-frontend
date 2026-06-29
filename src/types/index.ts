export interface Source {
  name: string;
  page?: string | null;
}

export interface ChatItem {
  id: string;
  title: string;
  isActive?: boolean;
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
  // 백엔드 message_id(UUID). 서버에서 로드/동기화된 메시지에만 존재(삭제 API 등에 사용).
  serverId?: string;
}

export interface AssistantMessage {
  id: string;
  role: 'assistant';
  type: 'text';
  content: string;
  status?: 'streaming' | 'done' | 'interrupted';
  sources?: Source[];
  createdAt?: string;
  // 백엔드 message_id(UUID). 서버에서 로드/동기화된 메시지에만 존재(삭제/재생성 API에 사용).
  serverId?: string;
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