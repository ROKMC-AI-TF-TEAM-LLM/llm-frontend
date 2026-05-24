import { backendApi } from '../lib/axios'
import { LOCAL_STORAGE_KEY } from '../../constants/key'
import type { GetMessagesResponse, StreamMessageRequest } from '../../types/chat'

export const getMessages = (sessionId: string) =>
  backendApi.get<GetMessagesResponse>(`/api/v1/sessions/${sessionId}/messages`)

export const streamMessage = async (
  sessionId: string,
  data: StreamMessageRequest,
  onChunk: (chunk: string) => void,
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
    }
  )

  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) return

  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data:')) continue
      const content = line.slice(5).trim()
      if (!content || content === '[DONE]') continue
      onChunk(content)
    }
  }
}
