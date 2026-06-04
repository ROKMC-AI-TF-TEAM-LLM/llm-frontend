export interface MessageItem {
  role: 'human' | 'ai';
  content: string;
  created_at: string;
  sources?: { name: string; page?: string | null }[];
}

// GetMessages
export interface GetMessagesResponse {
  success: boolean;
  status_code: number;
  data: {
    session_id: string;
    messages: MessageItem[];
  };
  error: { code: string; detail: string } | null;
}

// StreamMessage
export interface StreamMessageRequest {
  question: string;
}
