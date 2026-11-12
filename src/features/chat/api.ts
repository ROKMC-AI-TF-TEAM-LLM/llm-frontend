import {
  backendApi,
  refreshTokenOnce,
  getValidAccessToken,
  expireSession,
} from '@/lib/axios'
import { API_BASE_URL } from '@/lib/api'
import { logError } from '@/shared/utils/logError'
import {
  type GetMessagesResponse,
  type GetMessagesParams,
  type StreamMessageRequest,
  type DeleteMessageResponse,
  type Source,
  type Notice,
  noticeFromCode,
} from './types'
import type { FileAttachment } from '@/shared/types/attachment'

export const getMessages = (
  sessionId: string,
  params?: GetMessagesParams,
  options?: { signal?: AbortSignal },
) =>
  backendApi.get<GetMessagesResponse>(
    `/api/v1/sessions/${sessionId}/messages`,
    {
      params: { limit: 20, ...params },
      ...options,
    },
  )

export const deleteMessage = (sessionId: string, messageId: string) =>
  backendApi.delete<DeleteMessageResponse>(
    `/api/v1/sessions/${sessionId}/messages/${messageId}`,
  )

export const normalizeSource = (raw: unknown): Source => {
  const s = (raw ?? {}) as Record<string, unknown>
  const name = String(s.name ?? s.title ?? s.document_name ?? s.file_name ?? '')

  const rawPage =
    s.page ??
    s.page_no ??
    s.page_number ??
    s.pages ??
    s.page_num ??
    s.pageNo ??
    null

  const page =
    rawPage === null || rawPage === undefined || rawPage === '' || rawPage === 0
      ? null
      : Array.isArray(rawPage)
        ? rawPage.join(', ')
        : String(rawPage)

  const documentId = s.document_id ?? s.documentId ?? s.doc_id ?? null

  return {
    ...(documentId ? { document_id: String(documentId) } : {}),
    name,
    page,
  }
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

const postSse = async (
  url: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<Response> => {
  const makeRequest = (token: string | null) =>
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
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
      expireSession()
      throw new Error('HTTP 401', { cause: e })
    }
    response = await makeRequest(parsedToken)
  }

  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response
}

const readSse = async (
  response: Response,
  {
    onChunk,
    onSources,
    onFiles,
    onStatus,
    onThought,
    onNotice,
    signal,
  }: SseHandlers,
) => {
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) return

  signal?.addEventListener(
    'abort',
    () => {
      clearTimeout(idleTimer)
      reader.cancel()
    },
    { once: true },
  )

  const IDLE_MS = Number(import.meta.env.VITE_STREAM_IDLE_MS) || 1_200_000
  let timedOut = false
  let idleTimer = setTimeout(() => {
    timedOut = true
    reader.cancel()
  }, IDLE_MS)

  let buffer = ''
  /** 서버가 끝 신호(done)를 보냈는지. 없이 닫히면 답변이 중간에 끊긴 것이다 */
  let finished = false

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      timedOut = true
      reader.cancel()
    }, IDLE_MS)

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data:')) continue
      const raw = line.slice(5).startsWith(' ') ? line.slice(6) : line.slice(5)
      if (raw === '') continue
      const trimmed = raw.trim()
      if (trimmed === '[DONE]') {
        finished = true
        continue
      }

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

      const evt = parsed as {
        type?: string
        items?: unknown[]
        message?: string
        detail?: string
        content?: string
        answer?: string
        text?: string
        token?: string
        level?: string
        code?: string
        name?: string
        url?: string
        tool?: string
        thought?: string
        step?: number
      }
      if (evt.type === 'sources' && Array.isArray(evt.items)) {
        if (import.meta.env.DEV) {
          console.log('[SSE sources] 원본:', JSON.stringify(evt.items))
        }
        onSources?.(evt.items.map(normalizeSource))
      } else if (evt.type === 'file') {
        if (evt.name) onFiles?.([toAttachment(evt)])
      } else if (evt.type === 'files' && Array.isArray(evt.items)) {
        onFiles?.(
          evt.items.map((it) => toAttachment(it as Record<string, unknown>)),
        )
      } else if (evt.type === 'error') {
        logError(
          'SSE.errorEvent',
          evt.message || evt.detail || 'STREAM_ERROR',
          evt,
        )
        throw new Error(evt.message || evt.detail || 'STREAM_ERROR')
      } else if (evt.type === 'done') {
        finished = true
      } else if (evt.type === 'notice') {
        const fromCode = noticeFromCode(evt.code)
        if (fromCode) onNotice?.(fromCode)
        else if (evt.message)
          onNotice?.({
            code: evt.code ?? '',
            level: evt.level ?? 'warning',
            message: evt.message,
          })
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
      'AbortError',
    )
  }

  // 백엔드 계약: 정상 종료면 done이 항상 마지막에 한 번 오고, 실패면 done 대신 error가 온다.
  // 둘 다 없이 닫혔으면 네트워크 단절·프록시 시간 제한 등으로 중간에 끊긴 것이다.
  // 끊김으로 처리해야 잘린 답변이 완료로 보이지 않고 '다시 시도'가 나온다.
  // (백엔드는 done을 받아야 메시지를 저장하므로, 이 답변은 서버에도 남지 않았을 수 있다)
  // 다시 생성 쪽은 이 문구를 화면에 그대로 보여 준다.
  if (!finished) {
    logError('SSE.incomplete', '끝 신호(done) 없이 스트림이 닫힘', {
      url: response.url,
    })
    throw new Error('응답이 중간에 끊겼습니다.')
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
    `${API_BASE_URL}/api/v1/sessions/${sessionId}/messages/stream`,
    data,
    signal,
  )
  await readSse(response, {
    onChunk,
    onSources,
    onFiles,
    onStatus,
    onThought,
    onNotice,
    signal,
  })
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
  domain?: string,
) => {
  // 서버는 원래 질문의 분야를 저장하지 않는다. 재생성 때 다시 보내지 않으면 자동 분류로 바뀐다.
  const response = await postSse(
    `${API_BASE_URL}/api/v1/sessions/${sessionId}/messages/${messageId}/regenerate`,
    domain ? { domain } : undefined,
    signal,
  )
  await readSse(response, {
    onChunk,
    onSources,
    onFiles,
    onStatus,
    onThought,
    onNotice,
    signal,
  })
}
