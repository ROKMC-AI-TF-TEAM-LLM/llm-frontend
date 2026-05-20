import { backendApi } from '../lib/axios'
import type {
    LogoutRequest, LogoutResponse, 
    RefreshRequest, RefreshResponse,
    SignupRequest, SignupResponse,
    LoginRequest, LoginResponse
    } from '../../types/auth.ts'

export const logout = (data: LogoutRequest) =>
  backendApi.post<LogoutResponse>('/api/v1/auth/logout', data)

export const refresh = (data: RefreshRequest) =>
  backendApi.post<RefreshResponse>('/api/v1/auth/refresh', data)

export const signup = (data: SignupRequest) =>
  backendApi.post<SignupResponse>('/api/v1/auth/signup', data)

export const login = (data: LoginRequest) =>
  backendApi.post<LoginResponse>('/api/v1/auth/login', data)
