import { backendApi } from '../lib/axios'
import type {
    GetUsersRequest, GetUsersResponse,
    DeleteUsersResponse,
    PatchUsersRequest, PatchUsersResponse,
    InquiryUsersResponse,
    GetMeUsersResponse
    } from '../../types/user'

export const getUsers = (params: GetUsersRequest) =>
  backendApi.get<GetUsersResponse>('/admin/users', { params })

export const deleteUsers = (userId: number) =>
  backendApi.delete<DeleteUsersResponse>(`/admin/users/${userId}`)

export const patchUsers = (userId: number, data: PatchUsersRequest) =>
  backendApi.patch<PatchUsersResponse>(`/admin/users/${userId}`, data)

export const InquiryUsers = (userId: number) =>
  backendApi.get<InquiryUsersResponse>(`/admin/users/${userId}`)

export const getMeUsers = () =>
  backendApi.get<GetMeUsersResponse>('/users/me')