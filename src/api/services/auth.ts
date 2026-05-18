import { backendApi } from '../lib/axios'
import type {
    LogoutRequest, LogoutResponse, 
    RefreshRequest, RefreshResponse,
    } from '../../types/auth'

export const logout = (data: LogoutRequest) =>
  backendApi.post<LogoutResponse>('/auth/logout', data)

export const refresh = (data: RefreshRequest) =>
  backendApi.post<RefreshResponse>('/auth/refresh', data)