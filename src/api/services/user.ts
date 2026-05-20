import { backendApi } from '../lib/axios'
import type {
    GetUsersRequest, GetUsersResponse,
    DeleteUsersResponse,
    PatchUsersRequest, PatchUsersResponse,
    InquiryUsersResponse,
    GetMeUsersResponse
    } from '../../types/user'

export const getUsers = (params: GetUsersRequest) =>
  backendApi.get<GetUsersResponse>('/api/v1/admin/users', { params })

export const deleteUsers = (userId: number) =>
  backendApi.delete<DeleteUsersResponse>(`/api/v1/admin/users/${userId}`)

export const patchUsers = (userId: number, data: PatchUsersRequest) =>
  backendApi.patch<PatchUsersResponse>(`/api/v1/admin/users/${userId}`, data)

export const InquiryUsers = (userId: number) =>
  backendApi.get<InquiryUsersResponse>(`/api/v1/admin/users/${userId}`)

export const getMeUsers = () =>
  backendApi.get<GetMeUsersResponse>('/api/v1/users/me')