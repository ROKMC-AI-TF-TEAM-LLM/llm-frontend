import axios from 'axios'
import { LOCAL_STORAGE_KEY } from '../../constants/key'
import type { RefreshResponse } from '../../types/auth'
import { logError } from '../../utils/logError'

export const backendApi = axios.create({
  baseURL: import.meta.env.VITE_SERVER_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let pendingRefresh: Promise<string> | null = null

const parseStorageItem = (raw: string | null): string | null => {
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

const decodeTokenExp = (token: string): number | null => {
  try {
    // JWT payload는 base64url(-, _) 인코딩 → 표준 base64로 변환 + 패딩 후 디코드
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
    const originalRequest = error.config
    const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => originalRequest.url?.includes(path))

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true
      try {
        const newToken = await refreshTokenOnce()
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return backendApi(originalRequest)
      } catch (refreshError) {
        logError('axios.response.refresh', refreshError)
        sessionStorage.removeItem(LOCAL_STORAGE_KEY.ACCESS_TOKEN)
        localStorage.removeItem(LOCAL_STORAGE_KEY.REFRESH_TOKEN)
        window.location.href = '/'
        return Promise.reject(refreshError)
      }
    }

    logError(`axios.response:${originalRequest?.url ?? '?'}`, error)
    return Promise.reject(error)
  }
)

