import { backendApi } from '../lib/axios'
import type {
    LogoutRequest, LogoutResponse, 
    RefreshRequest, RefreshResponse,
    SignupRequest, SignupResponse,
    LoginRequest, LoginResponse
    } from '../../types/auth'

export const logout = (data: LogoutRequest) =>
  backendApi.post<LogoutResponse>('/auth/logout', data)

export const refresh = (data: RefreshRequest) =>
  backendApi.post<RefreshResponse>('/auth/refresh', data)

export const signup = (data: SignupRequest) =>
  backendApi.post<SignupResponse>('/auth/signup', data)

export const login = (data: LoginRequest) =>
  backendApi.post<LoginResponse>('/auth/login', data)
