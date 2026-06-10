import { backendApi, refreshTokenOnce } from '../lib/axios'
import { LOCAL_STORAGE_KEY } from '../../constants/key'
import type { GetMessagesResponse, StreamMessageRequest } from '../../types/chat'
import type { Source } from '../../types'

export const getMessages = (sessionId: string, options?: { signal?: AbortSignal }) =>
  backendApi.get<GetMessagesResponse>(`/api/v1/sessions/${sessionId}/messages`, options)


export const streamMessage = async (
  sessionId: string,
  data: StreamMessageRequest,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
  onSources?: (sources: Source[]) => void,
) => {
  const makeRequest = async (token: string | null) =>
    fetch(
      `${import.meta.env.VITE_SERVER_API_URL}/api/v1/sessions/${sessionId}/messages/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
        signal,
      }
    )

  const rawToken = sessionStorage.getItem(LOCAL_STORAGE_KEY.ACCESS_TOKEN)
  let parsedToken = rawToken ? JSON.parse(rawToken) : null

  let response = await makeRequest(parsedToken)

  if (response.status === 401) {
    try {
      parsedToken = await refreshTokenOnce()
    } catch {
      sessionStorage.removeItem(LOCAL_STORAGE_KEY.ACCESS_TOKEN)
      localStorage.removeItem(LOCAL_STORAGE_KEY.REFRESH_TOKEN)
      window.location.href = '/'
      throw new Error('HTTP 401')
    }
    response = await makeRequest(parsedToken)
  }

  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) return

  signal?.addEventListener('abort', () => {
    clearTimeout(idleTimer)
    reader.cancel()
  }, { once: true })

  const IDLE_MS = Number(import.meta.env.VITE_STREAM_IDLE_MS) || 1_200_000
  let timedOut = false
  let idleTimer = setTimeout(() => { timedOut = true; reader.cancel() }, IDLE_MS)

  let buffer = ''

  // ===== [임시 디버그] 백엔드가 실제로 보내는 raw SSE 확인용 =====
  let __rawAll = ''
  let __dataLineCount = 0
  let __textChunkCount = 0
  console.log('%c[STREAM] 시작', 'color:#888')
  // ============================================================

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => { timedOut = true; reader.cancel() }, IDLE_MS)

    const decoded = decoder.decode(value, { stream: true })
    __rawAll += decoded // [임시 디버그]
    buffer += decoded
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data:')) continue
      const content = line.slice(5).trim()
      if (!content || content === '[DONE]') continue
      __dataLineCount++ // [임시 디버그]
      try {
        const parsed = JSON.parse(content)
        console.log('[STREAM] data:', parsed) // [임시 디버그]
        if (parsed.type === 'sources' && Array.isArray(parsed.items)) {
          onSources?.(parsed.items)
        } else if (
          parsed.type === 'text' ||
          parsed.type === 'token' ||
          parsed.type === 'chunk' ||
          parsed.type === 'answer'
        ) {
          const chunk = parsed.content ?? parsed.answer ?? parsed.text ?? parsed.token
          if (chunk != null) { onChunk(String(chunk)); __textChunkCount++ } // [임시 디버그]
        } else if (parsed.type == null) {
          const chunk = parsed.content ?? parsed.answer ?? parsed.text
          if (chunk != null) { onChunk(String(chunk)); __textChunkCount++ } // [임시 디버그]
        }
      } catch {
        console.log('[STREAM] JSON 파싱 실패한 라인:', content) // [임시 디버그]
      }
    }
  }

  // ===== [임시 디버그] 요약 =====
  console.log(
    `%c[STREAM] 종료 — data 라인 ${__dataLineCount}개, 텍스트 청크 ${__textChunkCount}개`,
    'color:#0a0;font-weight:bold'
  )
  console.log('[STREAM] 전체 raw 응답:\n', __rawAll)
  if (__textChunkCount === 0) {
    console.warn('[STREAM] ⚠️ 텍스트 청크가 0개입니다. 위 raw 응답에 텍스트가 있으면 프론트 파서 문제, 없으면 백엔드(LLM) 문제입니다.')
  }
  // ==============================

  clearTimeout(idleTimer)

  if (timedOut || signal?.aborted) {
    throw new DOMException(
      timedOut ? 'Stream idle timeout.' : 'The user aborted a request.',
      'AbortError'
    )
  }
}
