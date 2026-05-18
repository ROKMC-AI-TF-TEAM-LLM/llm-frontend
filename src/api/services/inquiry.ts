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
  backendApi.get<GetinquiriesResponse>(`/inquiries/${inquiryId}`)

export const getInquiries = (params: InquiriesRequest) =>
  backendApi.get<InquiriesResponse>('/inquiries', { params })

export const postAnswer = (inquiryId: number, data: AnswerRequest) =>
  backendApi.post<AnswerResponse>(`/admin/inquiries/${inquiryId}/answer`, data)

export const getAdminInquiries = (params: AdminInquiriesRequest) =>
  backendApi.get<AdminInquiriesResponse>('/admin/inquiries', { params })

export const deleteInquiry = (inquiryId: number) =>
  backendApi.delete<DeleteInquiriesResponse>(`/inquiries/${inquiryId}`)

export const postInquiry = (data: PostInquiriesRequest) =>
  backendApi.post<PostInquiriesResponse>('/inquiries', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })