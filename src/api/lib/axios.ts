import axios from 'axios'
import { LOCAL_STORAGE_KEY } from '../../constants/key'
import type { RefreshResponse } from '../../types/auth'

export const backendApi = axios.create({
  baseURL: import.meta.env.VITE_SERVER_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let pendingRefresh: Promise<string> | null = null

export const refreshTokenOnce = (): Promise<string> => {
  if (!pendingRefresh) {
    const rawRefreshToken = localStorage.getItem(LOCAL_STORAGE_KEY.REFRESH_TOKEN)
    if (!rawRefreshToken) {
      return Promise.reject(new Error('No refresh token'))
    }
    pendingRefresh = backendApi
      .post<RefreshResponse>('/api/v1/auth/refresh', {
        refresh_token: JSON.parse(rawRefreshToken),
      })
      .then(({ data }) => {
        const { access_token, refresh_token } = data.data
        localStorage.setItem(LOCAL_STORAGE_KEY.ACCESS_TOKEN, JSON.stringify(access_token))
        localStorage.setItem(LOCAL_STORAGE_KEY.REFRESH_TOKEN, JSON.stringify(refresh_token))
        return access_token
      })
      .finally(() => {
        pendingRefresh = null
      })
  }
  return pendingRefresh
}

const AUTH_ENDPOINTS = ['/api/v1/auth/login', '/api/v1/auth/signup', '/api/v1/auth/refresh']

backendApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(LOCAL_STORAGE_KEY.ACCESS_TOKEN)
  if (token) {
    config.headers.Authorization = `Bearer ${JSON.parse(token)}`
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
        localStorage.removeItem(LOCAL_STORAGE_KEY.ACCESS_TOKEN)
        localStorage.removeItem(LOCAL_STORAGE_KEY.REFRESH_TOKEN)
        window.location.href = '/'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

