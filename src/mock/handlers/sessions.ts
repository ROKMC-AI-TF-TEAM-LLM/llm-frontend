import type { MessageItem, StreamMessageRequest } from '@/features/chat/types'
import type {
  CreateSessionRequest,
  SessionData,
} from '@/features/sessions/types'
import { claudeEvents, isClaudeEnabled } from '../claude'
import { createCutoff, interruptStream, type Fault } from '../control'
import { db, newId, now } from '../db'
import {
  cursorPage,
  del,
  fail,
  get,
  ok,
  patch,
  post,
  sleep,
  sse,
  type MockRoute,
} from '../server'

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

const byRecent = (a: SessionData, b: SessionData) =>
  b.updated_at.localeCompare(a.updated_at)

const findSession = (sessionId: string) =>
  db.sessions.find((session) => session.session_id === sessionId)

const sessionNotFound = () =>
  fail(404, 'SESSION_NOT_FOUND', '채팅을 찾을 수 없습니다.')

interface AnswerOptions {
  /** 만들고 있는 답변. 저장소에 들어 있지 않은 사본이다 */
  draft: MessageItem
  /** done을 보낼 때 한 번 부른다. 질문·답변을 저장소에 넣는다 */
  save: () => void
  signal: AbortSignal
  /** 이 답변 앞까지의 대화 (실제 Claude에 보낼 때 쓴다) */
  history: MessageItem[]
  fault: Fault | null
  /** 질문에 지정한 분야 코드. 없으면 모든 분야의 문서를 참고한다 */
  domain: string | undefined
}

/**
 * 상태 → 본문 조각 → 출처 → done 순서로 실제 서버와 같은 SSE 이벤트를 흘려보낸다.
 * 콘솔에서 장애를 걸어 두었으면(__mock.failNext) 본문 도중에 그 장애를 낸다.
 *
 * 실제 백엔드처럼 done을 보낼 때만 저장한다. 중간에 끊기거나 error로 끝나면 저장소는 그대로다
 * (새 질문이면 질문도 답변도 남지 않고, 다시 생성이면 원래 답변이 남는다).
 */
async function* answerEvents({
  draft,
  save,
  signal,
  history,
  fault,
  domain,
}: AnswerOptions) {
  const cutoff = createCutoff(fault)
  if (fault?.kind === 'empty') {
    // 생성에 실패했는데 본문 없이 done만 오는 경우 (백엔드 개선 요청서 4-2). 빈 답변으로 저장된다
    yield { type: 'status', message: '답변을 작성하는 중입니다.', step: 1 }
    save()
    yield { type: 'done' }
    return
  }
  if (await isClaudeEnabled()) {
    // 다음 단계(답변 작성)는 중계 서버가 문서를 찾은 뒤 보낸다
    yield {
      type: 'status',
      message: '관련 자료를 찾는 중입니다.',
      thought: '질문과 관련된 문서를 검색합니다.',
      step: 1,
    }
    for await (const event of claudeEvents(history, signal, domain)) {
      if (event.type === 'text') {
        const cut = cutoff()
        if (cut) return yield* interruptStream(cut, signal)
        draft.content += event.content
      }
      if (event.type === 'sources') draft.sources = event.items
      if (event.type === 'done') save()
      yield event
    }
    return
  }
  yield {
    type: 'status',
    message: '관련 자료를 찾는 중입니다.',
    thought: '질문과 관련된 문서를 검색합니다.',
    step: 1,
  }
  await sleep(600, signal)
  yield {
    type: 'status',
    message: '답변을 작성하는 중입니다.',
    thought: '검색한 문서로 답변을 구성합니다.',
    step: 2,
  }
  await sleep(400, signal)
  for (const chunk of ANSWER.match(/[^\n]{1,8}|\n/g) ?? []) {
    const cut = cutoff()
    if (cut) return yield* interruptStream(cut, signal)
    draft.content += chunk
    yield { type: 'text', content: chunk }
    await sleep(CHUNK_DELAY_MS, signal)
  }
  draft.sources = SOURCES
  yield { type: 'sources', items: SOURCES }
  save()
  yield { type: 'done' }
}

export const sessionRoutes: MockRoute[] = [
  get('/sessions', ({ query }) => {
    const favoriteOnly = query.get('is_favorite') === 'true'
    const sessions = db.sessions
      .filter((session) => !favoriteOnly || session.is_favorite)
      .sort(byRecent)
    return ok(cursorPage(sessions, query))
  }),

  get('/sessions/search', ({ query }) => {
    const q = query.get('q') ?? ''
    return ok(
      db.sessions.filter((session) => session.title.includes(q)).sort(byRecent),
    )
  }),

  post('/sessions', async ({ request }) => {
    const body = (await request.json()) as CreateSessionRequest
    const session: SessionData = {
      session_id: newId(),
      title: body.title || '새 채팅',
      project_id: body.project_id ?? null,
      is_favorite: false,
      updated_at: now(),
    }
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
    }),
  ),

  del('/sessions/:sessionId', ({ params }) => {
    const index = db.sessions.findIndex(
      (session) => session.session_id === params.sessionId,
    )
    if (index < 0) return sessionNotFound()
    db.sessions.splice(index, 1)
    delete db.messages[params.sessionId]
    return ok(null)
  }),

  get('/sessions/:sessionId/messages', ({ params }) => {
    if (!findSession(params.sessionId)) return sessionNotFound()
    return ok({
      items: db.messages[params.sessionId] ?? [],
      next_cursor: null,
      has_next: false,
    })
  }),

  del('/sessions/:sessionId/messages/:messageId', ({ params }) => {
    const list = db.messages[params.sessionId] ?? []
    const index = list.findIndex(
      (message) => message.message_id === params.messageId,
    )
    if (index < 0)
      return fail(404, 'MESSAGE_NOT_FOUND', '메시지를 찾을 수 없습니다.')
    list.splice(index, 1)
    return ok(null)
  }),

  post(
    '/sessions/:sessionId/messages/stream',
    async ({ request, params, fault }) => {
      const session = findSession(params.sessionId)
      if (!session) return sessionNotFound()
      const { question, domain } =
        (await request.json()) as StreamMessageRequest
      const list = (db.messages[params.sessionId] ??= [])
      const human: MessageItem = {
        message_id: newId(),
        role: 'human',
        content: question,
        domain,
        created_at: now(),
      }
      const draft: MessageItem = {
        message_id: newId(),
        role: 'ai',
        content: '',
        created_at: now(),
      }
      return sse(
        answerEvents({
          draft,
          save: () => {
            list.push(human, draft)
            session.updated_at = now()
          },
          signal: request.signal,
          history: [...list, human],
          fault,
          domain,
        }),
      )
    },
  ),

  post(
    '/sessions/:sessionId/messages/:messageId/regenerate',
    async ({ request, params, fault }) => {
      const session = findSession(params.sessionId)
      if (!session) return sessionNotFound()
      // 화면은 원래 질문의 분야를 본문에 다시 보낸다 (분야를 고르지 않았으면 본문이 없다)
      const { domain } = (await request.json().catch(() => ({}))) as {
        domain?: string
      }
      const list = db.messages[params.sessionId] ?? []
      const answer = list.find(
        (message) => message.message_id === params.messageId,
      )
      if (!answer)
        return fail(404, 'MESSAGE_NOT_FOUND', '메시지를 찾을 수 없습니다.')
      if (answer.role !== 'ai')
        return fail(
          400,
          'INVALID_MESSAGE_ROLE',
          'AI 답변만 다시 생성할 수 있습니다.',
        )
      // 새 답변은 사본에 만들고, done을 보낼 때 원래 답변을 바꾼다
      const draft: MessageItem = {
        ...answer,
        content: '',
        sources: undefined,
        created_at: now(),
      }
      return sse(
        answerEvents({
          draft,
          save: () => {
            Object.assign(answer, draft)
            session.updated_at = now()
          },
          signal: request.signal,
          history: list.slice(0, list.indexOf(answer)),
          fault,
          domain,
        }),
      )
    },
  ),
]
