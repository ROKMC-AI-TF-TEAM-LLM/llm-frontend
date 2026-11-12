// 답변 스트림(SSE) 해석. 서버 응답을 직접 만들어 넣고, 화면 쪽 콜백이 무엇을 받는지 본다.
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest'
import { refreshTokenOnce } from '@/lib/axios'
import { streamMessage } from './api'

vi.mock('@/lib/axios', () => ({
  backendApi: {},
  getValidAccessToken: vi.fn(async () => 'token'),
  refreshTokenOnce: vi.fn(async () => 'new-token'),
  expireSession: vi.fn(),
}))

const encoder = new TextEncoder()

/** 문자열 조각들을 그대로 흘려보내는 SSE 응답 */
const sseResponse = (parts: (string | Uint8Array)[], status = 200) =>
  new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const part of parts)
          controller.enqueue(
            typeof part === 'string' ? encoder.encode(part) : part,
          )
        controller.close()
      },
    }),
    { status, headers: { 'Content-Type': 'text/event-stream' } },
  )

const event = (body: object) => `data: ${JSON.stringify(body)}\n\n`

/** 응답을 정해 두고 streamMessage를 부른 뒤, 콜백이 받은 것을 모아 돌려준다 */
const run = async (
  responses: Response[],
  signal?: AbortSignal,
): Promise<{
  chunks: string[]
  sources: unknown[]
  statuses: string[]
  thoughts: string[]
  notices: unknown[]
  files: unknown[]
}> => {
  const fetchMock = vi.fn()
  for (const response of responses) fetchMock.mockResolvedValueOnce(response)
  vi.stubGlobal('fetch', fetchMock)

  const got = {
    chunks: [] as string[],
    sources: [] as unknown[],
    statuses: [] as string[],
    thoughts: [] as string[],
    notices: [] as unknown[],
    files: [] as unknown[],
  }
  await streamMessage(
    'session-1',
    { question: '질문' },
    (chunk) => got.chunks.push(chunk),
    signal,
    (sources) => got.sources.push(...sources),
    (status) => got.statuses.push(status),
    (files) => got.files.push(...files),
    (notice) => got.notices.push(notice),
    (thought) => got.thoughts.push(thought),
  )
  return got
}

let consoleError: MockInstance<typeof console.error>
beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  consoleError.mockRestore()
})

describe('readSse (streamMessage)', () => {
  it('상태·생각·본문·출처를 각각의 콜백으로 넘긴다', async () => {
    const got = await run([
      sseResponse([
        event({
          type: 'status',
          message: '찾는 중',
          thought: '문서 검색',
          step: 1,
        }),
        event({ type: 'text', content: '안녕' }),
        event({ type: 'text', content: '하세요' }),
        event({ type: 'sources', items: [{ name: '규정.pdf', page: '3' }] }),
        event({ type: 'done' }),
      ]),
    ])
    expect(got.statuses).toEqual(['찾는 중'])
    expect(got.thoughts).toEqual(['문서 검색'])
    expect(got.chunks.join('')).toBe('안녕하세요')
    expect(got.sources).toHaveLength(1)
    expect(got.sources[0]).toMatchObject({ name: '규정.pdf' })
  })

  it('네트워크 조각이 줄 중간이나 한글 글자 중간에서 나뉘어도 본문이 깨지지 않는다', async () => {
    const whole = encoder.encode(
      event({ type: 'text', content: '해병대 규정' }) + event({ type: 'done' }),
    )
    // '해'(3바이트) 한가운데와 줄 중간을 포함해 3바이트씩 자른다
    const pieces: Uint8Array[] = []
    for (let i = 0; i < whole.length; i += 3) pieces.push(whole.slice(i, i + 3))

    const got = await run([sseResponse(pieces)])
    expect(got.chunks.join('')).toBe('해병대 규정')
  })

  it('text 말고 token·chunk·answer 이름이나 type 없는 이벤트, 문자열 데이터도 본문으로 받는다', async () => {
    const got = await run([
      sseResponse([
        event({ type: 'token', token: 'a' }),
        event({ type: 'chunk', content: 'b' }),
        event({ type: 'answer', answer: 'c' }),
        event({ content: 'd' }),
        'data: "e"\n\n',
        'data: f\n\n',
        event({ type: 'done' }),
      ]),
    ])
    expect(got.chunks.join('')).toBe('abcdef')
  })

  it('error 이벤트를 받으면 그 문구로 실패한다', async () => {
    await expect(
      run([
        sseResponse([
          event({ type: 'text', content: '일부' }),
          event({ type: 'error', message: '생성 서버 오류' }),
        ]),
      ]),
    ).rejects.toThrow('생성 서버 오류')
  })

  it('요청을 멈추면 AbortError로 끝난다', async () => {
    const controller = new AbortController()
    // 멈출 때까지 닫히지 않는 스트림
    const response = new Response(
      new ReadableStream<Uint8Array>({
        start(stream) {
          stream.enqueue(encoder.encode(event({ type: 'text', content: '앞' })))
        },
      }),
    )
    const pending = run([response], controller.signal)
    await new Promise((resolve) => setTimeout(resolve, 10))
    controller.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('HTTP 오류면 상태 코드로 실패한다', async () => {
    await expect(run([sseResponse([], 500)])).rejects.toThrow('HTTP 500')
  })

  it('401이면 토큰을 갱신해 한 번 다시 요청한다', async () => {
    const got = await run([
      sseResponse([], 401),
      sseResponse([
        event({ type: 'text', content: '됨' }),
        event({ type: 'done' }),
      ]),
    ])
    expect(refreshTokenOnce).toHaveBeenCalledTimes(1)
    expect(got.chunks.join('')).toBe('됨')
  })

  describe('끝 신호', () => {
    const incompleteLogged = () =>
      consoleError.mock.calls.some((args) =>
        String(args[0]).includes('SSE.incomplete'),
      )

    it('done을 받으면 기록하지 않는다', async () => {
      await run([
        sseResponse([
          event({ type: 'text', content: 'a' }),
          event({ type: 'done' }),
        ]),
      ])
      expect(incompleteLogged()).toBe(false)
    })

    it('[DONE]도 끝 신호로 본다', async () => {
      await run([
        sseResponse([
          event({ type: 'text', content: 'a' }),
          'data: [DONE]\n\n',
        ]),
      ])
      expect(incompleteLogged()).toBe(false)
    })

    // 백엔드 계약: 정상이면 done, 실패면 error로 끝난다. 둘 다 없으면 중간에 끊긴 것이다
    it('끝 신호 없이 닫히면 받은 본문은 넘긴 뒤 끊김으로 실패하고 콘솔에 기록한다', async () => {
      const chunks: string[] = []
      vi.stubGlobal(
        'fetch',
        vi.fn(async () =>
          sseResponse([event({ type: 'text', content: '잘린 답' })]),
        ),
      )
      await expect(
        streamMessage('session-1', { question: '질문' }, (chunk) =>
          chunks.push(chunk),
        ),
      ).rejects.toThrow('응답이 중간에 끊겼습니다.')
      expect(chunks.join('')).toBe('잘린 답')
      expect(incompleteLogged()).toBe(true)
    })
  })
})
