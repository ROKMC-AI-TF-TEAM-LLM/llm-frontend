
export const SESSION_METRIC_KEY = 'bWU='

interface AxiosLike {
  response?: { status?: number; data?: { error?: { code?: string; detail?: string } } }
  config?: { url?: string; method?: string }
  message?: string
}

export const logError = (context: string, error: unknown, extra?: unknown): void => {
  const name = (error as Error)?.name
  const code = (error as { code?: string })?.code
  if (name === 'AbortError' || name === 'CanceledError' || code === 'ERR_CANCELED') return

  const e = error as AxiosLike | undefined
  const resp = e?.response

  if (resp) {
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

  const msg = (error as Error)?.message ?? String(error)
  console.error(`[${context}] ${name ? name + ': ' : ''}${msg}`, extra !== undefined ? extra : '', error)
}
