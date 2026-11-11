export type ApiError = {
  /** axios가 붙이는 코드 (예: 시간 초과 'ECONNABORTED'). 서버 오류 코드와 다르다 */
  code?: string
  response?: {
    status?: number
    data?: {
      error?: {
        code?: string
        detail?: string
      }
    }
  }
}

/** 서버 응답에서 오류 코드·설명·HTTP 상태를 꺼낸다. 응답이 없으면(네트워크 오류) 모두 undefined */
export const readApiError = (
  error: unknown,
): { code?: string; detail?: string; status?: number } => {
  const response = (error as ApiError)?.response
  return {
    code: response?.data?.error?.code,
    detail: response?.data?.error?.detail,
    status: response?.status,
  }
}

/** 여러 화면이 같이 쓰는 오류 문구. 같은 상황에는 같은 문장을 쓴다 */
export const ERROR_TEXT = {
  network: '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.',
  unauthorized: '인증이 만료되었습니다. 다시 로그인해주세요.',
} as const

export const getApiError = (
  error: unknown,
  codeMap: Record<string, string> = {},
  statusMap: Record<number, string> = {},
  fallback = '오류가 발생했습니다.',
): string => {
  const { code, status } = readApiError(error)

  if (code && codeMap[code]) return codeMap[code]
  if (status && statusMap[status]) return statusMap[status]
  return fallback
}

export const DEFAULT_STATUS_ERRORS: Record<number, string> = {
  401: ERROR_TEXT.unauthorized,
  403: '접근이 거부되었습니다. 관리자에게 문의하세요.',
  404: '요청한 리소스를 찾을 수 없습니다.',
  500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
}

export const isNetworkError = (error: unknown): boolean => {
  return !(error as ApiError)?.response
}

/**
 * 변경 요청이 실패했을 때 보여 줄 문구를 고른다.
 * 서버 코드별 문구(codeMap) → 시간 초과(timeout을 준 경우) → 연결 실패 → 기본 문구(fallback) 순서.
 */
export const describeApiError = (
  error: unknown,
  codeMap: Record<string, string>,
  fallback: string,
  timeout?: string,
): string => {
  const { code } = readApiError(error)
  if (code && codeMap[code]) return codeMap[code]
  if (timeout && (error as ApiError)?.code === 'ECONNABORTED') return timeout
  if (isNetworkError(error)) return ERROR_TEXT.network
  return fallback
}
