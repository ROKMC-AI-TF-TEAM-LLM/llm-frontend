import { createContext, useContext } from 'react'
import type { LoginRequest } from '../types/auth'

export interface AuthContextType {
  accessToken: string | null
  refreshToken: string | null
  login: (signInData: LoginRequest) => Promise<void>
  logout: () => Promise<void>
}

/** 값은 AuthProvider(AuthContext.tsx)가 채운다 */
export const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('authcontext를 찾을 수 없습니다.')
  }
  return context
}
