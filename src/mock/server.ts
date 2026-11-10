// 가짜 백엔드의 뼈대: 경로 매칭, 응답 봉투(success/status_code/data/error), 지연.
// 실제 서버와 같은 HTTP 응답(Response)을 돌려주므로 axios·fetch 쪽 코드는 mock인지 모른다.

const LATENCY_MS = 300

export interface MockContext {
  request: Request
  params: Record<string, string>
  query: URLSearchParams
}

type Handler = (ctx: MockContext) => Response | Promise<Response>

export interface MockRoute {
  method: string
  pattern: RegExp
  keys: string[]
  handler: Handler
  /** false면 Authorization 헤더 없이도 응답한다 (로그인·회원가입 등) */
  auth: boolean
}

const define = (method: string) => (path: string, handler: Handler, options?: { auth?: boolean }): MockRoute => {
  const keys: string[] = []
  const source = path.replace(/:(\w+)/g, (_, key: string) => {
    keys.push(key)
    return '([^/]+)'
  })
  return { method, pattern: new RegExp(`^${source}/?$`), keys, handler, auth: options?.auth ?? true }
}

export const get = define('GET')
export const post = define('POST')
export const patch = define('PATCH')
export const del = define('DELETE')

const json = (status: number, body: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

export const ok = (data: unknown = null, status = 200) =>
  json(status, { success: true, status_code: status, data, error: null })

export const fail = (status: number, code: string, detail: string) =>
  json(status, { success: false, status_code: status, data: null, error: { code, detail } })

export const file = (name: string, content: string) =>
  new Response(new Blob([content], { type: 'text/plain;charset=utf-8' }), {
    headers: { 'Content-Disposition': `attachment; filename="${encodeURIComponent(name)}"` },
  })

/** 서버가 보내는 SSE 이벤트 스트림. 클라이언트가 읽기를 멈추면 generator도 정리된다. */
export const sse = (events: AsyncGenerator<object>) => {
  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await events.next()
      if (done) controller.close()
      else controller.enqueue(encoder.encode(`data: ${JSON.stringify(value)}\n\n`))
    },
    async cancel() {
      await events.return(undefined)
    },
  })
  return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } })
}

export const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason)
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(signal.reason)
    }, { once: true })
  })

/** 커서 기반 목록 (`next_cursor`는 다음 시작 위치) */
export const cursorPage = <T>(items: T[], query: URLSearchParams, sizeKey = 'size') => {
  const start = Number(query.get('cursor')) || 0
  const size = Number(query.get(sizeKey)) || 20
  const end = start + size
  return { items: items.slice(start, end), next_cursor: end < items.length ? String(end) : null, has_next: end < items.length }
}

/** 오프셋 기반 목록 (문서 목록 API 형식) */
export const offsetPage = <T>(documents: T[], query: URLSearchParams) => {
  const offset = Number(query.get('offset')) || 0
  const limit = Number(query.get('limit')) || 50
  return { documents: documents.slice(offset, offset + limit), total: documents.length, offset, limit, has_more: offset + limit < documents.length }
}

export const createServer = (routes: MockRoute[]) => async (request: Request): Promise<Response> => {
  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/api\/v1/, '')
  await sleep(LATENCY_MS, request.signal)

  for (const route of routes) {
    if (route.method !== request.method) continue
    const match = route.pattern.exec(path)
    if (!match) continue
    if (route.auth && !request.headers.get('Authorization')) {
      return fail(401, 'UNAUTHORIZED', '로그인이 필요합니다.')
    }
    const params = Object.fromEntries(route.keys.map((key, i) => [key, decodeURIComponent(match[i + 1])]))
    return route.handler({ request, params, query: url.searchParams })
  }

  console.warn(`[mock] 정의되지 않은 API: ${request.method} ${url.pathname}`)
  return fail(404, 'MOCK_NOT_FOUND', `mock 응답이 없습니다: ${request.method} ${url.pathname}`)
}
