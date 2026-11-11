// `npm run dev:mock`에서만 켜지는 Vite 플러그인. mock 채팅이 정해진 예시 답변 대신 실제 Claude 응답을 받게 한다.
//
// - API 키(ANTHROPIC_API_KEY)는 이 개발 서버(Node)에서만 읽는다. 브라우저 코드와 빌드 결과물에는 들어가지 않는다.
//   키는 `.env.mock.local`에 둔다(git에 올라가지 않는다). `.env.mock`은 저장소에 올라가므로 거기에 적지 않는다.
// - 키가 없으면 /__mock/claude/status가 enabled: false를 돌려주고, src/mock은 기존 예시 답변을 쓴다.
// - 응답은 앱의 실제 백엔드와 같은 SSE 형식({type:'text'|'error'|'done'})으로 바꿔 보낸다.
import type { IncomingMessage, ServerResponse } from 'node:http'
import Anthropic from '@anthropic-ai/sdk'
import { loadEnv, type Plugin } from 'vite'

const DEFAULT_MODEL = 'claude-opus-5-5'

const SYSTEM = `당신은 MARS(Marine Artificial Intelligence Reasoning System)입니다. 해병대 장병이 규정·절차·업무에 대해 묻는 것에 답하는 업무 지원 AI입니다.

지금은 개발자가 화면을 확인하는 미리보기(mock) 환경에서 실행되고 있고, 참조할 규정 문서가 연결되어 있지 않습니다. 그래서:
- 일반적인 지식으로 답할 수 있는 질문에는 성실하게 답합니다.
- 특정 규정의 조항 번호, 수치, 기한처럼 원문을 확인해야 하는 내용은 지어내지 않습니다. 일반적으로 알려진 내용을 설명하되, 정확한 내용은 해당 규정 원문이나 담당 부서에서 확인해야 한다고 알려 줍니다.
- 출처나 문서 이름을 만들어 내지 않습니다.

한국어로, 업무 문서를 쓰듯 정중하고 간결하게 답합니다. 내용을 정리해야 이해하기 쉬울 때는 마크다운(제목, 목록, 표)을 씁니다.`

interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

const readJson = async (req: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
}

const sendJson = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

/** Claude API 오류를 화면에 보일 문구로 바꾼다 */
const describeError = (error: unknown): string => {
  if (error instanceof Anthropic.AuthenticationError)
    return 'Claude API 키가 올바르지 않습니다. .env.mock.local의 ANTHROPIC_API_KEY를 확인하세요.'
  if (error instanceof Anthropic.PermissionDeniedError)
    return '이 API 키로는 해당 모델을 쓸 수 없습니다.'
  if (error instanceof Anthropic.RateLimitError)
    return 'Claude API 요청 한도를 넘었습니다. 잠시 후 다시 시도하세요.'
  if (error instanceof Anthropic.APIConnectionError)
    return 'Claude API에 연결할 수 없습니다. 네트워크 상태를 확인하세요.'
  if (error instanceof Anthropic.APIError)
    return `Claude API 오류 (${error.status ?? '알 수 없음'}): ${error.message}`
  return 'Claude 응답을 받는 중 오류가 발생했습니다.'
}

export function claudeProxy(): Plugin {
  return {
    name: 'mock-claude-proxy',
    apply: 'serve',
    configureServer(server) {
      if (server.config.mode !== 'mock') return

      // 접두사를 ''로 주어 VITE_로 시작하지 않는 값도 읽는다 (브라우저로는 나가지 않는다)
      const env = loadEnv(server.config.mode, server.config.root, '')
      const apiKey = env.ANTHROPIC_API_KEY?.trim()
      const model = env.MOCK_CLAUDE_MODEL?.trim() || DEFAULT_MODEL
      const client = apiKey ? new Anthropic({ apiKey }) : null

      server.config.logger.info(
        client
          ? `  [mock] 채팅이 실제 Claude(${model})로 응답합니다.`
          : '  [mock] ANTHROPIC_API_KEY가 없어 채팅은 예시 답변으로 응답합니다. (.env.mock.local에 키를 넣으면 실제 Claude로 응답)',
      )

      server.middlewares.use('/__mock/claude/status', (_req, res) => {
        sendJson(res, 200, { enabled: !!client, model })
      })

      server.middlewares.use('/__mock/claude/stream', async (req, res) => {
        if (req.method !== 'POST')
          return sendJson(res, 405, { message: 'POST만 받습니다.' })
        if (!client)
          return sendJson(res, 503, {
            message: 'ANTHROPIC_API_KEY가 없습니다.',
          })

        let turns: ChatTurn[]
        try {
          const body = (await readJson(req)) as { messages?: ChatTurn[] }
          turns = (body.messages ?? []).filter(
            (m) =>
              (m.role === 'user' || m.role === 'assistant') &&
              typeof m.content === 'string' &&
              m.content.trim() !== '',
          )
        } catch {
          return sendJson(res, 400, { message: '요청 본문이 JSON이 아닙니다.' })
        }
        if (turns.length === 0 || turns[0].role !== 'user')
          return sendJson(res, 400, {
            message: '대화는 사용자 질문으로 시작해야 합니다.',
          })

        res.statusCode = 200
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
        res.setHeader('Cache-Control', 'no-cache')
        const send = (event: object) =>
          res.write(`data: ${JSON.stringify(event)}\n\n`)

        const stream = client.beta.messages.stream({
          model,
          max_tokens: 64000,
          system: SYSTEM,
          output_config: { effort: 'medium' },
          // 안전 분류기가 요청을 거절하면 서버가 알아서 다른 모델로 다시 시도한다
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          messages: turns,
        })
        // 화면에서 '중지'를 누르면 연결이 끊긴다. Claude 요청도 함께 멈춰 요금이 더 나가지 않게 한다
        res.on('close', () => {
          if (!res.writableEnded) stream.abort()
        })
        stream.on('text', (delta) => send({ type: 'text', content: delta }))

        try {
          const message = await stream.finalMessage()
          if (message.stop_reason === 'refusal')
            send({
              type: 'text',
              content: '\n\n_(이 요청에는 답변할 수 없습니다.)_',
            })
          else if (message.stop_reason === 'max_tokens')
            send({
              type: 'text',
              content: '\n\n_(답변이 길어 중간에 끊겼습니다.)_',
            })
          send({ type: 'done' })
        } catch (error) {
          if (error instanceof Anthropic.APIUserAbortError) return
          server.config.logger.error(`  [mock] Claude 오류: ${String(error)}`)
          send({ type: 'error', message: describeError(error) })
        } finally {
          res.end()
        }
      })
    },
  }
}
