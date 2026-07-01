// 에러를 콘솔에 "왜/무엇" 이 보이도록 일관되게 남긴다.
// - axios 에러면 HTTP 상태 / 요청 URL / 백엔드 error.code / detail 을 한 줄로 요약해서 보여준다.
// - 그 외(네트워크·JS 에러 등)는 메시지/스택을 그대로 보여준다.
// 끄고 싶으면 이 함수 본문만 비우면 전체가 조용해진다.

interface AxiosLike {
  response?: { status?: number; data?: { error?: { code?: string; detail?: string } } }
  config?: { url?: string; method?: string }
  message?: string
}

export const logError = (context: string, error: unknown, extra?: unknown): void => {
  const e = error as AxiosLike | undefined
  const resp = e?.response

  if (resp) {
    // 서버가 응답을 준 경우 = HTTP 에러. 상태/URL/백엔드 코드/detail 을 요약.
    const status = resp.status ?? '?'
    const method = (e?.config?.method ?? '').toUpperCase()
    const url = e?.config?.url ?? ''
    const code = resp.data?.error?.code
    const detail = resp.data?.error?.detail
    const summary =
      `[${context}] HTTP ${status} ${method} ${url}` +
      (code ? ` | code=${code}` : '') +
      (detail ? ` | detail=${detail}` : '')
    console.error(summary, extra !== undefined ? extra : '', error)
    return
  }

  // 응답이 없는 경우 = 네트워크 실패 / 요청 취소 / 프론트 JS 에러.
  const name = (error as Error)?.name
  const msg = (error as Error)?.message ?? String(error)
  console.error(`[${context}] ${name ? name + ': ' : ''}${msg}`, extra !== undefined ? extra : '', error)
}
