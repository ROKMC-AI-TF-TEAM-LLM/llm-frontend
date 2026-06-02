import { backendApi, refreshTokenOnce } from '../lib/axios'
import { LOCAL_STORAGE_KEY } from '../../constants/key'
import type { GetMessagesResponse, StreamMessageRequest } from '../../types/chat'
import type { Source } from '../../types'

export const getMessages = (sessionId: string) =>
  backendApi.get<GetMessagesResponse>(`/api/v1/sessions/${sessionId}/messages`)


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

  const rawToken = localStorage.getItem(LOCAL_STORAGE_KEY.ACCESS_TOKEN)
  let parsedToken = rawToken ? JSON.parse(rawToken) : null

  let response = await makeRequest(parsedToken)

  if (response.status === 401) {
    try {
      parsedToken = await refreshTokenOnce()
    } catch {
      localStorage.removeItem(LOCAL_STORAGE_KEY.ACCESS_TOKEN)
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

  signal?.addEventListener('abort', () => reader.cancel(), { once: true })

  const IDLE_MS = 120_000
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
      const content = line.slice(5).trim()
      if (!content || content === '[DONE]') continue
      try {
        const parsed = JSON.parse(content)
        if (parsed.type === 'text' && parsed.content != null) {
          onChunk(String(parsed.content))
        } else if (parsed.type === 'sources' && Array.isArray(parsed.items)) {
          onSources?.(parsed.items)
        }
      } catch {
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
