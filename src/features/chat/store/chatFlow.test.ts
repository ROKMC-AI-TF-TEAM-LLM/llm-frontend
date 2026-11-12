// 채팅 스토어의 질문·끊김·다시 시도 흐름. 스토어를 mock 서버에 붙여, 화면에서 버튼을 누르는 것과 같은 순서로 부른다.
// 장애는 failNext로 다음 요청 한 번에만 건다 (src/mock/control.ts).
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest'
import {
  connectMockBackend,
  createSession,
  db,
  failNext,
  serverMessages,
  signIn,
  watchRequests,
} from '@/test/mockBackend'
import { saveInflight } from '../storage'
import type { Message } from '../types'
import { useChatStore } from './index'

const store = () => useChatStore.getState()

type TextMessage = Extract<Message, { type: 'text' }>
const texts = () =>
  store().messages.filter((m): m is TextMessage => m.type === 'text')
const lastAnswer = () => {
  const last = texts().at(-1)
  if (last?.role !== 'assistant') throw new Error('마지막 메시지가 답변이 아님')
  return last
}

const waitIdle = () =>
  vi.waitFor(() => expect(store().isStreaming).toBe(false), { timeout: 3000 })

/** 새 대화에서 첫 질문을 보낸다 (ChatInput → 화면 이동 → connect와 같은 순서) */
const startChat = async (question: string) => {
  const sessionId = createSession()
  saveInflight(sessionId, question)
  await store().connect(sessionId)
  await waitIdle()
  return sessionId
}

/** 첫 질문이 정상으로 끝난 대화에서 다음 질문을 보낸다 */
const startChatWithAnswer = async () => {
  const sessionId = await startChat('첫 질문')
  expect(lastAnswer().status).toBe('done')
  return sessionId
}

let consoleError: MockInstance<typeof console.error>
beforeAll(connectMockBackend)
beforeEach(() => {
  signIn()
  store().disconnect()
  // 실패 경로는 logError로 콘솔에 남긴다. 테스트 출력이 지저분해지지 않게 막고, 필요한 곳에서 내용을 본다
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => consoleError.mockRestore())

describe('질문', () => {
  it('새 대화의 첫 질문에 답변과 출처를 받는다', async () => {
    const sessionId = await startChat('휴가 규정 알려줘')

    expect(texts().map((m) => m.role)).toEqual(['user', 'assistant'])
    expect(lastAnswer()).toMatchObject({ status: 'done' })
    expect(lastAnswer().content).toContain('Mock 답변')
    expect(lastAnswer().sources?.length).toBeGreaterThan(0)
    expect(serverMessages(sessionId).map((m) => m.role)).toEqual([
      'human',
      'ai',
    ])
  })

  it('첫 질문의 답변이 끊기면 대화를 지우고 오류를 보인다', async () => {
    failNext('stream', 'drop', { after: 2 })
    const sessionId = await startChat('첫 질문')

    expect(store()).toMatchObject({
      isDeleted: true,
      error: '응답 중 오류가 발생했습니다.',
    })
    await vi.waitFor(() =>
      expect(db.sessions.some((s) => s.session_id === sessionId)).toBe(false),
    )
  })
})

// 백엔드는 done을 보낼 때 질문·답변을 저장한다. 끊긴 질문은 서버에 남지 않으므로
// 끊긴 답변의 '다시 시도'는 질문을 다시 보내고, 완료된 답변의 '다시 생성'만 /regenerate를 부른다.
describe('끊긴 답변과 다시 시도', () => {
  it('두 번째 질문이 끊기면 중단 표시를 하고, 다시 시도하면 질문을 다시 보낸다', async () => {
    const sessionId = await startChatWithAnswer()

    failNext('stream', 'drop', { after: 3 })
    await store().sendMessage('두 번째 질문')
    expect(lastAnswer().status).toBe('interrupted')
    expect(lastAnswer().content.length).toBeGreaterThan(0)
    expect(store().error).toBe('응답 중 오류가 발생했습니다.')
    expect(serverMessages(sessionId)).toHaveLength(2) // 끊긴 질문은 저장되지 않음

    const sent = watchRequests()
    await store().regenerateMessage(lastAnswer().id)
    await waitIdle()

    expect(sent()).toEqual([
      `GET /sessions/${sessionId}/messages`,
      `POST /sessions/${sessionId}/messages/stream`,
    ])
    expect(texts().filter((m) => m.content === '두 번째 질문')).toHaveLength(1)
    expect(lastAnswer().status).toBe('done')
    expect(serverMessages(sessionId).map((m) => m.role)).toEqual([
      'human',
      'ai',
      'human',
      'ai',
    ])
  })

  it('본문 없이 done만 와서 빈 답변이 저장됐으면, 다시 시도는 빈 답변과 질문을 지우고 다시 보낸다', async () => {
    const sessionId = await startChatWithAnswer()

    failNext('stream', 'empty')
    await store().sendMessage('두 번째 질문')
    expect(lastAnswer().status).toBe('interrupted')
    expect(store().error).toBe(
      '응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.',
    )
    expect(serverMessages(sessionId).at(-1)).toMatchObject({
      role: 'ai',
      content: '',
    })

    const watch = watchRequests()
    await store().regenerateMessage(lastAnswer().id)
    await waitIdle()

    const sent = watch()
    expect(sent[0]).toBe(`GET /sessions/${sessionId}/messages`)
    expect(sent.filter((r) => r.startsWith('DELETE'))).toHaveLength(2) // 빈 답변 + 질문
    expect(sent.at(-1)).toBe(`POST /sessions/${sessionId}/messages/stream`)

    expect(texts().filter((m) => m.content === '두 번째 질문')).toHaveLength(1)
    expect(lastAnswer().status).toBe('done')
    expect(serverMessages(sessionId).map((m) => m.role)).toEqual([
      'human',
      'ai',
      'human',
      'ai',
    ])
  })

  it('완료된 답변을 다시 생성하면 /regenerate로 같은 답변 자리를 바꾼다', async () => {
    const sessionId = await startChatWithAnswer()
    const answer = lastAnswer()
    const serverAnswer = serverMessages(sessionId)[1]

    const sent = watchRequests()
    await store().regenerateMessage(answer.id)

    expect(sent()).toEqual([
      `GET /sessions/${sessionId}/messages`,
      `POST /sessions/${sessionId}/messages/${serverAnswer.message_id}/regenerate`,
    ])
    expect(lastAnswer()).toMatchObject({ id: answer.id, status: 'done' })
    expect(texts()).toHaveLength(2)
    expect(serverMessages(sessionId)).toHaveLength(2)
  })

  it('다시 생성이 실패하면 중단 표시가 되지만 서버의 원래 답변은 남고, 한 번 더 시도할 수 있다', async () => {
    const sessionId = await startChatWithAnswer()
    const answer = lastAnswer()
    const original = serverMessages(sessionId)[1].content

    failNext('regenerate', 'http', { status: 500 })
    await store().regenerateMessage(answer.id)
    expect(lastAnswer()).toMatchObject({ id: answer.id, status: 'interrupted' })
    expect(store().isStreaming).toBe(false)
    // 지금은 오류 문구로 'HTTP 500'이 그대로 보인다 (사용자용 문구가 아님)
    expect(store().error).toBe('HTTP 500')
    expect(serverMessages(sessionId)[1].content).toBe(original)

    await store().regenerateMessage(answer.id)
    expect(lastAnswer()).toMatchObject({ id: answer.id, status: 'done' })
  })

  it('서버가 error 이벤트를 보내면 중단 표시를 한다', async () => {
    await startChatWithAnswer()
    failNext('stream', 'error', { after: 2, message: '생성 서버 오류' })
    await store().sendMessage('두 번째 질문')

    expect(lastAnswer().status).toBe('interrupted')
    expect(store().error).toBe('응답 중 오류가 발생했습니다.')
  })

  it('끝 신호(done) 없이 닫히면 받은 데까지 보이되 중단 표시를 하고, 다시 시도할 수 있다', async () => {
    await startChatWithAnswer()
    failNext('stream', 'close', { after: 3 })
    await store().sendMessage('두 번째 질문')

    expect(lastAnswer().status).toBe('interrupted')
    expect(lastAnswer().content.length).toBeGreaterThan(0)
    expect(store().error).toBe('응답 중 오류가 발생했습니다.')
    expect(
      consoleError.mock.calls.some((args) =>
        String(args[0]).includes('SSE.incomplete'),
      ),
    ).toBe(true)

    await store().regenerateMessage(lastAnswer().id)
    expect(lastAnswer().status).toBe('done')
  })

  it('다시 생성이 done 없이 닫히면 끊겼다고 알리고, 서버의 원래 답변은 남는다', async () => {
    const sessionId = await startChatWithAnswer()
    const original = serverMessages(sessionId)[1].content

    failNext('regenerate', 'close', { after: 2 })
    await store().regenerateMessage(lastAnswer().id)
    expect(lastAnswer().status).toBe('interrupted')
    expect(store().error).toBe('응답이 중간에 끊겼습니다.')
    expect(serverMessages(sessionId)[1].content).toBe(original)
  })

  it('사용자가 멈추면 중단 표시를 하고, 다시 시도할 수 있다', async () => {
    await startChatWithAnswer()
    failNext('stream', 'stall', { after: 2 })
    const sending = store().sendMessage('두 번째 질문')
    await vi.waitFor(() =>
      expect(lastAnswer().content.length).toBeGreaterThan(0),
    )

    store().abortStream()
    await sending
    expect(lastAnswer().status).toBe('interrupted')
    expect(store().error).toBeNull()

    await store().regenerateMessage(lastAnswer().id)
    expect(lastAnswer().status).toBe('done')
  })
})
