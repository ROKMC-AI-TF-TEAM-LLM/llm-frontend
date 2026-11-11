import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMeUsers, getUsers, deleteUsers, inquiryUsers, approveUser, rejectUser } from './api'
import type { GetAdminUsersParams } from './types'
import { useAuth } from '@/features/auth/useAuth'

export const useGetMe = () => {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['me'],
    queryFn: () => getMeUsers(),
    enabled: !!accessToken,
    retry: false,
  })
}

export const useGetUsers = (params?: GetAdminUsersParams) => {
  return useQuery({
    queryKey: ['users', 'list', params],
    queryFn: () => getUsers(params),
    retry: false,
  })
}

export const useInquiryUsers = (userId: string) => {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => inquiryUsers(userId),
    retry: false,
  })
}

export const useDeleteUsers = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => deleteUsers(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export const useApproveUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => approveUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export const useRejectUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => rejectUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

