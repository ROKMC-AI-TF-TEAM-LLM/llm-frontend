export interface SessionData {
  session_id: string;
  title: string;
  updated_at: string;
}

export interface SessionPageData {
  items: SessionData[];
  next_cursor: string | null;
  has_next: boolean;
}

// GetSessions
export interface GetSessionsResponse {
  success: boolean;
  status_code: number;
  data: SessionPageData;
  error: { code: string; detail: string } | null;
}

// CreateSession
export interface CreateSessionRequest {
  title: string;
}
export interface CreateSessionResponse {
  success: boolean;
  status_code: number;
  data: SessionData;
  error: { code: string; detail: string } | null;
}

// SearchSessions
export interface SearchSessionsRequest {
  q: string;
}
export interface SearchSessionsResponse {
  success: boolean;
  status_code: number;
  data: SessionData[];
  error: { code: string; detail: string } | null;
}

// UpdateSession
export interface UpdateSessionRequest {
  title: string;
}
export interface UpdateSessionResponse {
  success: boolean;
  status_code: number;
  data: SessionData;
  error: { code: string; detail: string } | null;
}

// DeleteSession
export interface DeleteSessionResponse {
  success: boolean;
  status_code: number;
  data: null;
  error: { code: string; detail: string } | null;
}
