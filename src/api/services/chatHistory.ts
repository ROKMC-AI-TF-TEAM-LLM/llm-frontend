import { backendApi } from '../lib/axios'
import type {
    HistoryRequest, HistoryResponse,
    GetHistoryRequest, GetHistoryResponse,
    DeleteHistoryResponse,
    //PatchsHistoryRequest, PatchsHistoryResponse
    } from '../../types/chatHistory'

export const history = (params: HistoryRequest) =>
  backendApi.get<HistoryResponse>('/api/v1/chat/history', { params })

export const gethistory = (sessionId: number, params: GetHistoryRequest) =>
  backendApi.get<GetHistoryResponse>(`/api/v1/chat/history/${sessionId}`, { params })

export const deleteHistory = (sessionId: number) =>
  backendApi.delete<DeleteHistoryResponse>(`/api/v1/chat/history/${sessionId}`)

// export const patchshistory = (sessionId: number, params: PatchsHistoryRequest) =>
//   backendApi.patch<PatchsHistoryResponse>(`/api/v1/chat/history/${sessionId}`, { params })