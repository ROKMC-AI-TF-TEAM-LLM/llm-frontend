import { backendApi, refreshTokenOnce, getValidAccessToken } from '../lib/axios'
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

  let parsedToken = await getValidAccessToken()

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
        throw new Error(evt.message || evt.detail || 'STREAM_ERROR')
      } else if (evt.type === 'done') {
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
