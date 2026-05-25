import { backendApi } from '../lib/axios'
import type {
    AdminUsersResponse,
    AdminUserDeleteResponse,
    AdminUserInquiryResponse,
    GetMeResponse,
    AdminUserApproveResponse,
    AdminUserRejectResponse,
    } from '../../types/user'

export const getUsers = () =>
  backendApi.get<AdminUsersResponse>('/api/v1/admin/users')

export const deleteUsers = (userId: string) =>
  backendApi.delete<AdminUserDeleteResponse>(`/api/v1/admin/users/${userId}`)

export const InquiryUsers = (userId: string) =>
  backendApi.get<AdminUserInquiryResponse>(`/api/v1/admin/users/${userId}`)

export const getMeUsers = () =>
  backendApi.get<GetMeResponse>('/api/v1/users/me')

export const approveUser = (userId: string) =>
  backendApi.patch<AdminUserApproveResponse>(`/api/v1/admin/users/${userId}/approve`)

export const rejectUser = (userId: string) =>
  backendApi.patch<AdminUserRejectResponse>(`/api/v1/admin/users/${userId}/reject`)
