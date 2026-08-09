export interface Source {
  name: string;
  page?: string | null;
}

export interface Notice {
  code: string;
  level: 'warning' | 'info' | string;
  message: string;
}

export interface FileAttachment {
  attachment_id: string;
  name: string;
  size?: number;
  url?: string;
}

export interface ChatItem {
  id: string;
  title: string;
  isActive?: boolean;
  isFavorite?: boolean;
  projectId?: string;
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
  attachments?: FileAttachment[];
  notice?: Notice;
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