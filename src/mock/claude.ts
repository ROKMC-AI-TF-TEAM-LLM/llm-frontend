// 실제 Claude 응답 연결 (선택). `npm run dev:mock`의 개발 서버에 ANTHROPIC_API_KEY가 있으면
// 채팅 답변을 정해진 예시 대신 Claude에게서 받는다. 키는 개발 서버만 알고, 여기(브라우저)에는 오지 않는다.
// 중계는 mock-server/claudeProxy.ts가 한다. 정적 빌드(build:mock)에는 중계가 없으므로 항상 예시 답변을 쓴다.

import type { MessageItem } from '@/features/chat/types'

let enabled: Promise<boolean> | null = null

/** 개발 서버가 Claude에 연결돼 있는지. 한 번만 묻고 기억한다 */
export const isClaudeEnabled = (): Promise<boolean> =>
  (enabled ??= fetch('/__mock/claude/status')
    .then((res) => (res.ok ? res.json() : { enabled: false }))
    .then((body: { enabled?: boolean }) => body.enabled === true)
    .catch(() => false))

/** 서버에 쌓인 대화를 Claude에 보낼 모양으로 바꾼다 (빈 답변은 뺀다) */
export const toClaudeMessages = (history: MessageItem[]) =>
  history
    .filter((message) => message.content.trim() !== '')
    .map((message) => ({
      role:
        message.role === 'human' ? ('user' as const) : ('assistant' as const),
      content: message.content,
    }))

export type ClaudeEvent =
  | { type: 'text'; content: string }
  | { type: 'error'; message: string }
  | { type: 'done' }

/** 지금까지의 대화를 보내고 답변을 조각(SSE)으로 받는다. signal이 끊기면 요청도 멈춘다 */
export async function* claudeEvents(
  history: MessageItem[],
  signal: AbortSignal,
): AsyncGenerator<ClaudeEvent> {
  const res = await fetch('/__mock/claude/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: toClaudeMessages(history) }),
    signal,
  })
  if (!res.ok || !res.body) {
    const detail = await res
      .json()
      .then((body: { message?: string }) => body.message)
      .catch(() => undefined)
    yield {
      type: 'error',
      message: detail ?? `Claude 중계 오류 (${res.status})`,
    }
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) return
      buffer += decoder.decode(value, { stream: true })
      const blocks = buffer.split('\n\n')
      buffer = blocks.pop() ?? ''
      for (const block of blocks) {
        const data = block.replace(/^data: /, '').trim()
        if (data) yield JSON.parse(data) as ClaudeEvent
      }
    }
  } finally {
    // 중지했을 때 개발 서버 쪽 연결도 닫는다
    await reader.cancel().catch(() => {})
  }
}
