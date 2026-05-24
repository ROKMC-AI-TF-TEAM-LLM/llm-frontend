import { backendApi } from '../lib/axios'
import type {
  GetSessionsResponse,
  CreateSessionRequest, CreateSessionResponse,
  SearchSessionsRequest, SearchSessionsResponse,
  UpdateSessionRequest, UpdateSessionResponse,
  DeleteSessionResponse,
} from '../../types/session'

export const getSessions = () =>
  backendApi.get<GetSessionsResponse>('/api/v1/sessions')

export const createSession = (data: CreateSessionRequest) =>
  backendApi.post<CreateSessionResponse>('/api/v1/sessions', data)

export const searchSessions = (params: SearchSessionsRequest) =>
  backendApi.get<SearchSessionsResponse>('/api/v1/sessions/search', { params })

export const updateSession = (sessionId: string, data: UpdateSessionRequest) =>
  backendApi.patch<UpdateSessionResponse>(`/api/v1/sessions/${sessionId}`, data)

export const deleteSession = (sessionId: string) =>
  backendApi.delete<DeleteSessionResponse>(`/api/v1/sessions/${sessionId}`)
