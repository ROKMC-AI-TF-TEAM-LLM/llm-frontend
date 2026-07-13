import { backendApi } from '../lib/axios'
import type {
  GetSessionsResponse,
  CreateSessionRequest, CreateSessionResponse,
  SearchSessionsRequest, SearchSessionsResponse,
  UpdateSessionRequest, UpdateSessionResponse,
  SetFavoriteRequest, SetFavoriteResponse,
  DeleteSessionResponse,
} from '../../types/session'

export const getSessions = (cursor?: string | null, size = 20) =>
  backendApi.get<GetSessionsResponse>('/api/v1/sessions', { params: { cursor, size } })

export const createSession = (data: CreateSessionRequest) =>
  backendApi.post<CreateSessionResponse>('/api/v1/sessions', data)

export const searchSessions = (params: SearchSessionsRequest) =>
  backendApi.get<SearchSessionsResponse>('/api/v1/sessions/search', { params })

export const updateSession = (sessionId: string, data: UpdateSessionRequest) =>
  backendApi.patch<UpdateSessionResponse>(`/api/v1/sessions/${sessionId}`, data)

// 즐겨찾기는 제목 수정(PATCH /sessions/{id})과 별개인 전용 엔드포인트다.
export const setFavorite = (sessionId: string, data: SetFavoriteRequest) =>
  backendApi.patch<SetFavoriteResponse>(`/api/v1/sessions/${sessionId}/favorite`, data)

export const deleteSession = (sessionId: string) =>
  backendApi.delete<DeleteSessionResponse>(`/api/v1/sessions/${sessionId}`)
