import axios from 'axios'
import { LOCAL_STORAGE_KEY } from './storageKeys'
import { API_BASE_URL } from './api'
import { logError } from '@/shared/utils/logError'
import { clearStoredChatData } from '@/shared/utils/chatStorage'

// 토큰 갱신(/auth/refresh) 응답. 갱신은 모든 요청이 기대는 기반이라 auth 기능이 아니라 여기서 다룬다
interface RefreshResponse {
  success: boolean
  status_code: number
  data: { access_token: string; refresh_token: string; token_type: string }
  error: { code: 'TOKEN_INVALID' | 'VALIDATION_ERROR'; detail: string } | null
}

export const backendApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const CLIENT_CHANNEL = 'PZkZh'

let pendingRefresh: Promise<string> | null = null

const parseStorageItem = (raw: string | null): string | null => {
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

const decodeTokenExp = (token: string): number | null => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const payload = JSON.parse(atob(padded))
    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

const isTokenExpired = (token: string): boolean => {
  const exp = decodeTokenExp(token)
  if (!exp) return true
  return Date.now() >= exp * 1000 - 5_000
}

export const getValidAccessToken = async (): Promise<string | null> => {
  const token = parseStorageItem(sessionStorage.getItem(LOCAL_STORAGE_KEY.ACCESS_TOKEN))
  if (!token) return null
  if (isTokenExpired(token)) {
    try { return await refreshTokenOnce() } catch (e) { logError('getValidAccessToken.refresh', e); return null }
  }
  return token
}

let proactiveTimer: ReturnType<typeof setTimeout> | null = null

export const scheduleTokenRefresh = (): void => {
  if (proactiveTimer) { clearTimeout(proactiveTimer); proactiveTimer = null }
  const token = parseStorageItem(sessionStorage.getItem(LOCAL_STORAGE_KEY.ACCESS_TOKEN))
  if (!token) return
  const exp = decodeTokenExp(token)
  if (!exp) return
  const delay = Math.max(exp * 1000 - Date.now() - 60_000, 3_000)
  proactiveTimer = setTimeout(() => {
    refreshTokenOnce().catch(() => {})
  }, delay)
}

/** 토큰을 더 갱신할 수 없을 때: 저장된 토큰과 대화 캐시를 지우고 로그인 화면으로 보낸다 */
export const expireSession = () => {
  sessionStorage.removeItem(LOCAL_STORAGE_KEY.ACCESS_TOKEN)
  localStorage.removeItem(LOCAL_STORAGE_KEY.REFRESH_TOKEN)
  clearStoredChatData()
  window.location.href = '/'
}

export const refreshTokenOnce = (): Promise<string> => {
  if (!pendingRefresh) {
    const refreshToken = parseStorageItem(localStorage.getItem(LOCAL_STORAGE_KEY.REFRESH_TOKEN))
    if (!refreshToken) {
      return Promise.reject(new Error('No refresh token'))
    }
    pendingRefresh = backendApi
      .post<RefreshResponse>('/api/v1/auth/refresh', { refresh_token: refreshToken })
      .then(({ data }) => {
        const { access_token, refresh_token } = data.data
        sessionStorage.setItem(LOCAL_STORAGE_KEY.ACCESS_TOKEN, JSON.stringify(access_token))
        localStorage.setItem(LOCAL_STORAGE_KEY.REFRESH_TOKEN, JSON.stringify(refresh_token))
        scheduleTokenRefresh()
        return access_token
      })
      .finally(() => {
        pendingRefresh = null
      })
  }
  return pendingRefresh
}

const AUTH_ENDPOINTS = ['/api/v1/auth/login', '/api/v1/auth/signup', '/api/v1/auth/refresh']

backendApi.interceptors.request.use(async (config) => {
  const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => config.url?.includes(path))
  let token = parseStorageItem(sessionStorage.getItem(LOCAL_STORAGE_KEY.ACCESS_TOKEN))
  if (token && !isAuthEndpoint && isTokenExpired(token)) {
    try { token = await refreshTokenOnce() } catch (e) { logError('axios.request.refresh', e) }
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

backendApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config
    const requestUrl: string = originalRequest?.url ?? ''
    const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => requestUrl.includes(path))

    if (error?.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true
      try {
        const newToken = await refreshTokenOnce()
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return backendApi(originalRequest)
      } catch (refreshError) {
        logError('axios.response.refresh', refreshError)
        expireSession()
        return Promise.reject(refreshError)
      }
    }

    if (!error?.response) {
      const baseUrl = API_BASE_URL || '(VITE_SERVER_API_URL 미설정 — 같은 도메인 /api)'
      logError(
        `axios.response:${requestUrl || '(요청 전 실패)'}`,
        error,
        {
          진단: !originalRequest
            ? '요청이 만들어지지 못함 — 요청 인터셉터 예외 가능성'
            : error?.code === 'ECONNABORTED'
              ? '타임아웃 — 서버가 응답하지 않음'
              : 'CORS 차단 · 서버 다운 · 주소 오류 중 하나 (브라우저 Network 탭에서 확인)',
          요청주소: baseUrl + requestUrl,
          axios코드: error?.code ?? '(없음)',
        },
      )
      return Promise.reject(error)
    }

    logError(`axios.response:${requestUrl || '?'}`, error)
    return Promise.reject(error)
  }
)

