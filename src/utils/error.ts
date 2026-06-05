type ApiError = {
  response?: {
    status?: number
    data?: {
      error?: {
        code?: string
      }
    }
  }
}

/**
 * API 에러 객체에서 에러 메시지를 추출합니다.
 * @param error - catch 블록의 unknown 에러
 * @param codeMap - 에러 코드 → 메시지 매핑 (우선 적용)
 * @param statusMap - HTTP 상태 코드 → 메시지 매핑 (코드 매핑 실패 시 적용)
 * @param fallback - 매핑 실패 시 기본 메시지
 */
export const getApiError = (
  error: unknown,
  codeMap: Record<string, string> = {},
  statusMap: Record<number, string> = {},
  fallback = '오류가 발생했습니다.',
): string => {
  const err = error as ApiError
  const code = err?.response?.data?.error?.code
  const status = err?.response?.status

  if (code && codeMap[code]) return codeMap[code]
  if (status && statusMap[status]) return statusMap[status]
  return fallback
}

export const DEFAULT_STATUS_ERRORS: Record<number, string> = {
  401: '인증이 만료되었습니다. 다시 로그인해주세요.',
  403: '접근이 거부되었습니다. 관리자에게 문의하세요.',
  404: '요청한 리소스를 찾을 수 없습니다.',
  500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
}

export const isNetworkError = (error: unknown): boolean => {
  return !(error as ApiError)?.response
}
