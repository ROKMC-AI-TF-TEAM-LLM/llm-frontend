import axios from 'axios'
import { LOCAL_STORAGE_KEY } from '../../constants/key'
import type { RefreshResponse } from '../../types/auth'

export const backendApi = axios.create({
  baseURL: import.meta.env.VITE_SERVER_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const llmApi = axios.create({
  baseURL: import.meta.env.VITE_LLM_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

backendApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(LOCAL_STORAGE_KEY.ACCESS_TOKEN)
  if (token) {
    config.headers.Authorization = `Bearer ${JSON.parse(token)}`
  }
  return config
})

const AUTH_ENDPOINTS = ['/api/v1/auth/login', '/api/v1/auth/signup', '/api/v1/auth/refresh']

backendApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => originalRequest.url?.includes(path))

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem(LOCAL_STORAGE_KEY.REFRESH_TOKEN)
        const { data } = await backendApi.post<RefreshResponse>('/api/v1/auth/refresh', {
          refresh_token: JSON.parse(refreshToken!)
        })

        localStorage.setItem(LOCAL_STORAGE_KEY.ACCESS_TOKEN, JSON.stringify(data.data.access_token))
        localStorage.setItem(LOCAL_STORAGE_KEY.REFRESH_TOKEN, JSON.stringify(data.data.refresh_token))

        originalRequest.headers.Authorization = `Bearer ${data.data.access_token}`
        return backendApi(originalRequest)

      } catch (refreshError) {
        localStorage.removeItem(LOCAL_STORAGE_KEY.ACCESS_TOKEN)
        localStorage.removeItem(LOCAL_STORAGE_KEY.REFRESH_TOKEN)
        window.location.href = '/signin'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

llmApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(LOCAL_STORAGE_KEY.ACCESS_TOKEN)
  if (token) {
    config.headers.Authorization = `Bearer ${JSON.parse(token)}`
  }
  return config
})

llmApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem(LOCAL_STORAGE_KEY.REFRESH_TOKEN)
        const { data } = await backendApi.post<RefreshResponse>('/api/v1/auth/refresh', {
          refresh_token: JSON.parse(refreshToken!)
        })

        localStorage.setItem(LOCAL_STORAGE_KEY.ACCESS_TOKEN, JSON.stringify(data.data.access_token))
        localStorage.setItem(LOCAL_STORAGE_KEY.REFRESH_TOKEN, JSON.stringify(data.data.refresh_token))

        originalRequest.headers.Authorization = `Bearer ${data.data.access_token}`
        return llmApi(originalRequest)

      } catch (refreshError) {
        localStorage.removeItem(LOCAL_STORAGE_KEY.ACCESS_TOKEN)
        localStorage.removeItem(LOCAL_STORAGE_KEY.REFRESH_TOKEN)
        window.location.href = '/signin'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)