import { backendApi, refreshTokenOnce, getValidAccessToken } from '../lib/axios'
import { LOCAL_STORAGE_KEY } from '../../constants/key'
import { logError } from '../../utils/logError'
import type { GetMessagesResponse, GetMessagesParams, StreamMessageRequest, DeleteMessageResponse } from '../../types/chat'
import type { Source, FileAttachment, Notice } from '../../types'
import { noticeFromCode } from '../../types'

export const getMessages = (
  sessionId: string,
  params?: GetMessagesParams,
  options?: { signal?: AbortSignal },
) =>
  backendApi.get<GetMessagesResponse>(`/api/v1/sessions/${sessionId}/messages`, {
    params: { limit: 20, ...params },
    ...options,
  })

export const deleteMessage = (sessionId: string, messageId: string) =>
  backendApi.delete<DeleteMessageResponse>(`/api/v1/sessions/${sessionId}/messages/${messageId}`)

export const normalizeSource = (raw: unknown): Source => {
  const s = (raw ?? {}) as Record<string, unknown>
  const name = String(s.name ?? s.title ?? s.document_name ?? s.file_name ?? '')

  const rawPage =
    s.page ?? s.page_no ?? s.page_number ?? s.pages ?? s.page_num ?? s.pageNo ?? null

  const page =
    rawPage === null || rawPage === undefined || rawPage === '' || rawPage === 0
      ? null
      : Array.isArray(rawPage)
        ? rawPage.join(', ')
        : String(rawPage)

  return { name, page }
}

export const toAttachment = (raw: Record<string, unknown>): FileAttachment => {
  const name = String(raw.name ?? '')
  const url = typeof raw.url === 'string' ? raw.url : undefined
  const attachment_id = String(raw.attachment_id ?? url ?? name)
  const tool = typeof raw.tool === 'string' ? raw.tool : undefined
  const size = typeof raw.size === 'number' ? raw.size : undefined
  return { attachment_id, name, url, tool, size }
}

interface SseHandlers {
  onChunk: (chunk: string) => void
  onSources?: (sources: Source[]) => void
  onFiles?: (files: FileAttachment[]) => void
  onStatus?: (message: string) => void
  onThought?: (thought: string, step?: number) => void
  onNotice?: (notice: Notice) => void
  signal?: AbortSignal
}

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

const readSse = async (response: Response, { onChunk, onSources, onFiles, onStatus, onThought, onNotice, signal }: SseHandlers) => {
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

      const evt = parsed as { type?: string; items?: unknown[]; message?: string; detail?: string; content?: string; answer?: string; text?: string; token?: string; level?: string; code?: string; name?: string; url?: string; tool?: string; thought?: string; step?: number }
      if (evt.type === 'sources' && Array.isArray(evt.items)) {
        if (import.meta.env.DEV) {
          console.log('[SSE sources] 원본:', JSON.stringify(evt.items))
        }
        onSources?.(evt.items.map(normalizeSource))
      } else if (evt.type === 'file') {
        if (evt.name) onFiles?.([toAttachment(evt)])
      } else if (evt.type === 'files' && Array.isArray(evt.items)) {
        onFiles?.(evt.items.map((it) => toAttachment(it as Record<string, unknown>)))
      } else if (evt.type === 'error') {
        logError('SSE.errorEvent', evt.message || evt.detail || 'STREAM_ERROR', evt)
        throw new Error(evt.message || evt.detail || 'STREAM_ERROR')
      } else if (evt.type === 'done') {
      } else if (evt.type === 'notice') {
        const fromCode = noticeFromCode(evt.code)
        if (fromCode) onNotice?.(fromCode)
        else if (evt.message) onNotice?.({ code: evt.code ?? '', level: evt.level ?? 'warning', message: evt.message })
      } else if (evt.type === 'status') {
        if (evt.message) onStatus?.(evt.message)
        if (evt.thought) onThought?.(evt.thought, evt.step)
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
  onStatus?: (message: string) => void,
  onFiles?: (files: FileAttachment[]) => void,
  onNotice?: (notice: Notice) => void,
  onThought?: (thought: string, step?: number) => void,
) => {
  const response = await postSse(
    `${import.meta.env.VITE_SERVER_API_URL}/api/v1/sessions/${sessionId}/messages/stream`,
    data,
    signal,
  )
  await readSse(response, { onChunk, onSources, onFiles, onStatus, onThought, onNotice, signal })
}

export const regenerateMessageStream = async (
  sessionId: string,
  messageId: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
  onSources?: (sources: Source[]) => void,
  onStatus?: (message: string) => void,
  onFiles?: (files: FileAttachment[]) => void,
  onNotice?: (notice: Notice) => void,
  onThought?: (thought: string, step?: number) => void,
) => {
  const response = await postSse(
    `${import.meta.env.VITE_SERVER_API_URL}/api/v1/sessions/${sessionId}/messages/${messageId}/regenerate`,
    undefined,
    signal,
  )
  await readSse(response, { onChunk, onSources, onFiles, onStatus, onThought, onNotice, signal })
}
