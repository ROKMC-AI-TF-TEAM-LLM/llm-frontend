import { backendApi } from '../lib/axios'
import type { GetDocumentsResponse, GetDocumentsParams, DocumentItem } from '../../types/document'

// 백엔드 응답 형태가 { items }, { documents }, 또는 배열 자체일 수 있어 안전하게 문서 배열을 뽑아낸다.
export const pickDocuments = (data: unknown): DocumentItem[] => {
  if (Array.isArray(data)) return data as DocumentItem[]
  const d = data as { items?: DocumentItem[]; documents?: DocumentItem[] } | null | undefined
  return d?.items ?? d?.documents ?? []
}

// 문서 조회는 백엔드(LLM) 사정으로 응답이 지연/무응답일 수 있어, 타임아웃을 둬서
// 무한 로딩(스켈레톤) 대신 에러 UI로 떨어지도록 한다.
export const getDocuments = (params?: GetDocumentsParams) =>
  backendApi.get<GetDocumentsResponse>('/api/v1/documents', { params, timeout: 30000 })