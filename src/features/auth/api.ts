import { backendApi } from '@/lib/axios'
import type {
  LogoutRequest,
  LogoutResponse,
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginResponse,
} from './types'

export const logout = (data: LogoutRequest) =>
  backendApi.post<LogoutResponse>('/api/v1/auth/logout', data)

export const signup = (data: SignupRequest) =>
  backendApi.post<SignupResponse>('/api/v1/auth/signup', data)

export const login = (data: LoginRequest) =>
  backendApi.post<LoginResponse>('/api/v1/auth/login', data)
