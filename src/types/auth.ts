"백엔드 API-Auth"
// Logout
export interface LogoutRequest {
  refreshToken: string
}

export interface LogoutResponse {
  code: number
  message: string
}

// Refresh
export interface RefreshRequest {
  refreshToken: string
}

export interface RefreshResponse {
  code: number
  message: string
  data: {
    accessToken: string
    refreshToken: string
    tokenType: string
    expiresIn: number
  }
}

// Signup
export interface SignupRequest {
  email: string
  password: string
  nickname: string
}

export interface SignupResponse {
  code: number
  message: string
  data: {
    userId: number
    email: string
    nickname: string
    createdAt: string
  }
}

// Login
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  code: number
  message: string
  data: {
    accessToken: string
    refreshToken: string
    tokenType: string
    expiresIn: number
    user: {
      userId: number
      email: string
      nickname: string
      role: string
    }
  }
}

"백엔드 API-User"
"백엔드 API-Chat"
"백엔드 API-ChatHistory"
"백엔드 API-Inquiry"