import { backendApi, refreshTokenOnce, getValidAccessToken } from '../lib/axios'
import { LOCAL_STORAGE_KEY } from '../../constants/key'
import { logError } from '../../utils/logError'
import type { GetMessagesResponse, StreamMessageRequest, DeleteMessageResponse } from '../../types/chat'
import type { Source } from '../../types'

export const getMessages = (sessionId: string, options?: { signal?: AbortSignal }) =>
  backendApi.get<GetMessagesResponse>(`/api/v1/sessions/${sessionId}/messages`, options)

export const deleteMessage = (sessionId: string, messageId: string) =>
  backendApi.delete<DeleteMessageResponse>(`/api/v1/sessions/${sessionId}/messages/${messageId}`)

interface SseHandlers {
  onChunk: (chunk: string) => void
  onSources?: (sources: Source[]) => void
  signal?: AbortSignal
}

// access token을 붙여 SSE(POST)를 요청하고, 401이면 1회 refresh 후 재시도한다.
const postSse = async (url: string, body: unknown, signal?: AbortSignal): Promise<Response> => {
  const makeRequest = (token: string | null) =>
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...(body != null ? { body: JSON.stringify(body) } : {}),
      signal,
    })

  let parsedToken = await getValidAccessToken()
  let response = await makeRequest(parsedToken)

  if (response.status === 401) {
    try {
      parsedToken = await refreshTokenOnce()
    } catch (e) {
      logError('postSse.refresh', e)
      sessionStorage.removeItem(LOCAL_STORAGE_KEY.ACCESS_TOKEN)
      localStorage.removeItem(LOCAL_STORAGE_KEY.REFRESH_TOKEN)
      window.location.href = '/'
      throw new Error('HTTP 401', { cause: e })
    }
    response = await makeRequest(parsedToken)
  }

  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response
}

// SSE(text/event-stream) 본문을 읽어 텍스트 토큰/sources/done/error 이벤트를 처리한다.
// 일반 채팅 스트리밍과 재생성 스트리밍이 동일한 이벤트 형식을 쓰므로 공유한다.
const readSse = async (response: Response, { onChunk, onSources, signal }: SseHandlers) => {
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

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => { timedOut = true; reader.cancel() }, IDLE_MS)

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data:')) continue
      const raw = line.slice(5).startsWith(' ') ? line.slice(6) : line.slice(5)
      if (raw === '') continue
      const trimmed = raw.trim()
      if (trimmed === '[DONE]') continue

      let parsed: unknown
      let isObject = false
      if (trimmed) {
        try {
          parsed = JSON.parse(trimmed)
          isObject = typeof parsed === 'object' && parsed !== null
        } catch {
          parsed = undefined
        }
      }

      if (!isObject) {
        const text = typeof parsed === 'string' ? parsed : raw
        if (text) onChunk(text)
        continue
      }

      const evt = parsed as { type?: string; items?: Source[]; message?: string; detail?: string; content?: string; answer?: string; text?: string; token?: string }
      if (evt.type === 'sources' && Array.isArray(evt.items)) {
        onSources?.(evt.items)
      } else if (evt.type === 'error') {
        logError('SSE.errorEvent', evt.message || evt.detail || 'STREAM_ERROR', evt)
        throw new Error(evt.message || evt.detail || 'STREAM_ERROR')
      } else if (evt.type === 'done') {
        /* 완료 신호 — 별도 처리 없음(루프 종료는 reader done으로 처리) */
      } else if (
        evt.type === 'text' ||
        evt.type === 'token' ||
        evt.type === 'chunk' ||
        evt.type === 'answer'
      ) {
        const chunk = evt.content ?? evt.answer ?? evt.text ?? evt.token
        if (chunk != null) onChunk(String(chunk))
      } else if (evt.type == null) {
        const chunk = evt.content ?? evt.answer ?? evt.text
        if (chunk != null) onChunk(String(chunk))
      }
    }
  }

  clearTimeout(idleTimer)

  if (timedOut || signal?.aborted) {
    throw new DOMException(
      timedOut ? 'Stream idle timeout.' : 'The user aborted a request.',
      'AbortError'
    )
  }
}

export const streamMessage = async (
  sessionId: string,
  data: StreamMessageRequest,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
  onSources?: (sources: Source[]) => void,
) => {
  const response = await postSse(
    `${import.meta.env.VITE_SERVER_API_URL}/api/v1/sessions/${sessionId}/messages/stream`,
    data,
    signal,
  )
  await readSse(response, { onChunk, onSources, signal })
}

// AI 메시지 재생성: 기존 AI 응답(messageId)을 서버에서 삭제하고 동일 질문으로 재스트리밍한다.
// body 없음. messageId는 반드시 role: 'ai' 메시지의 ID여야 한다.
export const regenerateMessageStream = async (
  sessionId: string,
  messageId: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
  onSources?: (sources: Source[]) => void,
) => {
  const response = await postSse(
    `${import.meta.env.VITE_SERVER_API_URL}/api/v1/sessions/${sessionId}/messages/${messageId}/regenerate`,
    undefined,
    signal,
  )
  await readSse(response, { onChunk, onSources, signal })
}
