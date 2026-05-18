import { backendApi } from '../lib/axios'
import type {
    HistoryRequest, HistoryResponse,
    GetHistoryRequest, GetHistoryResponse,
    DeleteHistoryResponse,
    //PatchsHistoryRequest, PatchsHistoryResponse
    } from '../../types/chathistory'

export const history = (params: HistoryRequest) =>
  backendApi.get<HistoryResponse>('/chat/history', { params })

export const gethistory = (sessionId: number, params: GetHistoryRequest) =>
  backendApi.get<GetHistoryResponse>(`/chat/history/${sessionId}`, { params })

export const deleteHistory = (sessionId: number) =>
  backendApi.delete<DeleteHistoryResponse>(`/chat/history/${sessionId}`)

// export const patchshistory = (sessionId: number, params: PatchsHistoryRequest) =>
//   backendApi.patch<PatchsHistoryResponse>(`/chat/history/${sessionId}`, { params })