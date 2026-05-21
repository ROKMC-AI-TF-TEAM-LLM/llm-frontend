export interface Source {
  id: string;
  title: string;
  url?: string;
  snippet?: string;
}

export interface ChatItem {
  id: string;
  title: string;
  isActive?: boolean;
}

export interface User {
  name: string;
}

export interface UserMessage {
  id: string;
  role: 'user';
  type: 'text';
  content: string;
}

export interface AssistantMessage {
  id: string;
  role: 'assistant';
  type: 'text';
  content: string;
  status?: 'streaming' | 'done';
  sources?: Source[];
}

export interface ImageMessage {
  id: string;
  role: 'user' | 'assistant';
  type: 'image';
  filename: string;
  caption?: string;
}

export interface User {
  id: string
  name: string
}

export interface ChatItem {
  id: string
  title: string
}

export type Message = UserMessage | AssistantMessage | ImageMessage;
export type MessageRole = 'user' | 'assistant';