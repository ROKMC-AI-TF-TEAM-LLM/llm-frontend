import { backendApi } from '../lib/axios'
import type {
    GetinquiriesResponse,
    InquiriesRequest, InquiriesResponse,
    AnswerRequest, AnswerResponse,
    AdminInquiriesRequest, AdminInquiriesResponse,
    DeleteInquiriesResponse,
    PostInquiriesRequest, PostInquiriesResponse
    } from '../../types/inquiry'

export const getInquiry = (inquiryId: number) =>
  backendApi.get<GetinquiriesResponse>(`/api/v1/inquiries/${inquiryId}`)

export const getInquiries = (params: InquiriesRequest) =>
  backendApi.get<InquiriesResponse>('/api/v1/inquiries', { params })

export const postAnswer = (inquiryId: number, data: AnswerRequest) =>
  backendApi.post<AnswerResponse>(`/api/v1/admin/inquiries/${inquiryId}/answer`, data)

export const getAdminInquiries = (params: AdminInquiriesRequest) =>
  backendApi.get<AdminInquiriesResponse>('/api/v1/admin/inquiries', { params })

export const deleteInquiry = (inquiryId: number) =>
  backendApi.delete<DeleteInquiriesResponse>(`/api/v1/inquiries/${inquiryId}`)

export const postInquiry = (data: PostInquiriesRequest) =>
  backendApi.post<PostInquiriesResponse>('/api/v1/inquiries', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })