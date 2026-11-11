import { createContext, useContext } from 'react'
import type { LoginRequest } from './types'

// 로그인 상태 context와 그 훅. 공급자 컴포넌트는 AuthProvider.tsx
// (컴포넌트 파일에 context·훅을 같이 두면 개발 중 빠른 새로고침이 동작하지 않는다)

export interface AuthContextType {
  accessToken: string | null
  refreshToken: string | null
  login: (signInData: LoginRequest) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('authcontext를 찾을 수 없습니다.')
  }
  return context
}
