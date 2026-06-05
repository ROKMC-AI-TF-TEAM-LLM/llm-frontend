import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMeUsers, getUsers, deleteUsers, inquiryUsers, approveUser, rejectUser } from '../api/services/user'
import type { UserRole, UserStatus, GetAdminUsersParams } from '../types/user'
import { useAuth } from '../context/AuthContext'

export const useGetMe = () => {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['me'],
    queryFn: () => getMeUsers(),
    enabled: !!accessToken,
    retry: false,
  })
}

export const useInfiniteUsers = (params?: { role?: UserRole; status?: UserStatus; search?: string; size?: number }) => {
  return useInfiniteQuery({
    queryKey: ['users', 'infinite', params],
    queryFn: ({ pageParam }) =>
      getUsers({ ...params, cursor: pageParam as string | undefined }),
    getNextPageParam: (lastPage) => {
      const data = lastPage.data.data
      return data.has_next && data.next_cursor ? data.next_cursor : undefined
    },
    initialPageParam: undefined as string | undefined,
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
