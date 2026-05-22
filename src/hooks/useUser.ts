import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMeUsers, getUsers, deleteUsers, patchUsers, InquiryUsers } from '../api/services/user'
import type { GetUsersRequest, PatchUsersRequest } from '../types/user'

export const useGetMe = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => getMeUsers(),
  })
}

export const useGetUsers = (params: GetUsersRequest) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => getUsers(params),
  })
}

export const useInquiryUsers = (userId: number) => {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => InquiryUsers(userId),
  })
}

export const useDeleteUsers = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => deleteUsers(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export const usePatchUsers = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: PatchUsersRequest }) =>
      patchUsers(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}