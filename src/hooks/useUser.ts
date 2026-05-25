import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMeUsers, getUsers, deleteUsers, InquiryUsers, approveUser, rejectUser } from '../api/services/user'
import { useAuth } from '../context/AuthContext'

export const useGetMe = () => {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['me'],
    queryFn: () => getMeUsers(),
    enabled: !!accessToken,
  })
}

export const useGetUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
    retry: false,
  })
}

export const useInquiryUsers = (userId: string) => {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => InquiryUsers(userId),
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
