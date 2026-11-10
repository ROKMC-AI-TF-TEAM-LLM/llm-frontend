import type { MessageItem, StreamMessageRequest } from '../../types/chat'
import type { CreateSessionRequest, SessionData } from '../../types/session'
import { db, newId, now } from '../db'
import { cursorPage, del, fail, get, ok, patch, post, sleep, sse, type MockRoute } from '../server'

const CHUNK_DELAY_MS = 30

const ANSWER = [
  '## Mock 답변',
  '',
  '백엔드 없이 실행 중입니다. 입력한 질문에 대한 **예시 답변**입니다.',
  '',
  '| 항목 | 상태 |',
  '| --- | --- |',
  '| 채팅 전송·중지·재생성 | 가능 |',
  '| 프로젝트·자료실 | 가능 |',
  '',
  '실제 AI 응답은 일반 개발 모드(`npm run dev`)에서 확인할 수 있습니다.',
].join('\n')

const SOURCES = [
  { name: 'UI 미리보기 안내.pdf', page: '1' },
  { name: '복무 규정.hwp', page: '12' },
]

const byRecent = (a: SessionData, b: SessionData) => b.updated_at.localeCompare(a.updated_at)

const findSession = (sessionId: string) => db.sessions.find((session) => session.session_id === sessionId)

const sessionNotFound = () => fail(404, 'SESSION_NOT_FOUND', '채팅을 찾을 수 없습니다.')

/** 상태 → 본문 조각 → 출처 순서로 실제 서버와 같은 SSE 이벤트를 흘려보낸다. */
async function* answerEvents(session: SessionData, answer: MessageItem, signal: AbortSignal) {
  try {
    yield { type: 'status', message: '관련 자료를 찾는 중입니다.', thought: '질문과 관련된 문서를 검색합니다.', step: 1 }
    await sleep(600, signal)
    yield { type: 'status', message: '답변을 작성하는 중입니다.', thought: '검색한 문서로 답변을 구성합니다.', step: 2 }
    await sleep(400, signal)
    for (const chunk of ANSWER.match(/[^\n]{1,8}|\n/g) ?? []) {
      answer.content += chunk
      yield { type: 'text', content: chunk }
      await sleep(CHUNK_DELAY_MS, signal)
    }
    answer.sources = SOURCES
    yield { type: 'sources', items: SOURCES }
    yield { type: 'done' }
  } finally {
    // 중간에 멈춰도 그때까지 받은 내용은 서버에 남은 것처럼 유지한다
    session.updated_at = now()
  }
}

export const sessionRoutes: MockRoute[] = [
  get('/sessions', ({ query }) => {
    const favoriteOnly = query.get('is_favorite') === 'true'
    const sessions = db.sessions.filter((session) => !favoriteOnly || session.is_favorite).sort(byRecent)
    return ok(cursorPage(sessions, query))
  }),

  get('/sessions/search', ({ query }) => {
    const q = query.get('q') ?? ''
    return ok(db.sessions.filter((session) => session.title.includes(q)).sort(byRecent))
  }),

  post('/sessions', async ({ request }) => {
    const body = await request.json() as CreateSessionRequest
    const session: SessionData = { session_id: newId(), title: body.title || '새 채팅', project_id: body.project_id ?? null, is_favorite: false, updated_at: now() }
    db.sessions.unshift(session)
    return ok(session, 201)
  }),

  // 제목 변경(`/sessions/:id`)과 즐겨찾기(`/sessions/:id/favorite`)는 body만 다르다
  ...['/sessions/:sessionId', '/sessions/:sessionId/favorite'].map((path) =>
    patch(path, async ({ request, params }) => {
      const session = findSession(params.sessionId)
      if (!session) return sessionNotFound()
      Object.assign(session, await request.json(), { updated_at: now() })
      return ok(session)
    })),

  del('/sessions/:sessionId', ({ params }) => {
    const index = db.sessions.findIndex((session) => session.session_id === params.sessionId)
    if (index < 0) return sessionNotFound()
    db.sessions.splice(index, 1)
    delete db.messages[params.sessionId]
    return ok(null)
  }),

  get('/sessions/:sessionId/messages', ({ params }) => {
    if (!findSession(params.sessionId)) return sessionNotFound()
    return ok({ items: db.messages[params.sessionId] ?? [], next_cursor: null, has_next: false })
  }),

  del('/sessions/:sessionId/messages/:messageId', ({ params }) => {
    const list = db.messages[params.sessionId] ?? []
    const index = list.findIndex((message) => message.message_id === params.messageId)
    if (index < 0) return fail(404, 'MESSAGE_NOT_FOUND', '메시지를 찾을 수 없습니다.')
    list.splice(index, 1)
    return ok(null)
  }),

  post('/sessions/:sessionId/messages/stream', async ({ request, params }) => {
    const session = findSession(params.sessionId)
    if (!session) return sessionNotFound()
    const { question, domain } = await request.json() as StreamMessageRequest
    const list = db.messages[params.sessionId] ??= []
    const answer: MessageItem = { message_id: newId(), role: 'ai', content: '', created_at: now() }
    list.push({ message_id: newId(), role: 'human', content: question, domain, created_at: now() }, answer)
    return sse(answerEvents(session, answer, request.signal))
  }),

  post('/sessions/:sessionId/messages/:messageId/regenerate', ({ request, params }) => {
    const session = findSession(params.sessionId)
    if (!session) return sessionNotFound()
    const answer = db.messages[params.sessionId]?.find((message) => message.message_id === params.messageId)
    if (!answer) return fail(404, 'MESSAGE_NOT_FOUND', '메시지를 찾을 수 없습니다.')
    if (answer.role !== 'ai') return fail(400, 'INVALID_MESSAGE_ROLE', 'AI 답변만 다시 생성할 수 있습니다.')
    Object.assign(answer, { content: '', sources: undefined, created_at: now() })
    return sse(answerEvents(session, answer, request.signal))
  }),
]
