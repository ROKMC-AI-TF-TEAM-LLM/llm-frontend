import { backendApi } from '../lib/axios'
import { LOCAL_STORAGE_KEY } from '../../constants/key'
import type { GetMessagesResponse, StreamMessageRequest } from '../../types/chat'

export const getMessages = (sessionId: string) =>
  backendApi.get<GetMessagesResponse>(`/api/v1/sessions/${sessionId}/messages`)


export const streamMessage = async (
  sessionId: string,
  data: StreamMessageRequest,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
) => {
  const token = localStorage.getItem(LOCAL_STORAGE_KEY.ACCESS_TOKEN)
  const parsedToken = token ? JSON.parse(token) : null

  const response = await fetch(
    `${import.meta.env.VITE_SERVER_API_URL}/api/v1/sessions/${sessionId}/messages/stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        ...(parsedToken && { Authorization: `Bearer ${parsedToken}` }),
      },
      body: JSON.stringify(data),
      signal,
    }
  )

  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) return

  signal?.addEventListener('abort', () => reader.cancel(), { once: true })

  // Cancel stream if no chunk arrives within 2 minutes (hung LLM / Ollama stall)
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
        }
        // done / sources / error types are intentionally ignored on the client side
      } catch {
        // Not valid JSON — silently skip rather than passing protocol noise to the UI
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
