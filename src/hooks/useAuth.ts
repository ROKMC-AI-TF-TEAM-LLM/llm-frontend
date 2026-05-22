import { useMutation } from '@tanstack/react-query'
import { logout, refresh } from '../api/services/auth'
import type { LogoutRequest, RefreshRequest } from '../types/auth'

export const useLogout = () => {
  return useMutation({
    mutationFn: (data: LogoutRequest) => logout(data),
  })
}

export const useRefresh = () => {
  return useMutation({
    mutationFn: (data: RefreshRequest) => refresh(data),
  })
}