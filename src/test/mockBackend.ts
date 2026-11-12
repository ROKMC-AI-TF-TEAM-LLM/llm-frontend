// 테스트에서 앱 코드를 mock 서버(src/mock)에 붙인다.
// 화면에서 `npm run dev:mock`을 쓸 때와 같은 핸들러가 응답하므로, 스토어·API·SSE 해석을 실제 흐름 그대로 확인할 수 있다.
//
//   beforeAll(connectMockBackend)   // 파일마다 한 번
//   const id = createSession()  // 테스트마다 새 대화
//   failNext('stream', 'drop')  // 다음 요청에 장애
import { vi } from 'vitest'
import { backendApi } from '@/lib/axios'
import { LOCAL_STORAGE_KEY } from '@/lib/storageKeys'
import { lastRequestSeq, mockOptions, requestRecords } from '@/mock/control'
import { db, newId, now } from '@/mock/db'
import { handleMockRequest } from '@/mock/index'

export { failNext } from '@/mock/control'
export { db } from '@/mock/db'

/** 만료 시각만 보는 가짜 JWT (mock 서버는 Authorization 헤더가 있는지만 본다) */
const fakeToken = () => {
  const payload = btoa(JSON.stringify({ exp: 4_102_444_800 })) // 2100년
  return `header.${payload}.signature`
}

export const connectMockBackend = () => {
  mockOptions.delayScale = 0
  mockOptions.logRequests = false

  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    const raw = input instanceof Request ? input.url : String(input)
    const url = new URL(raw, 'http://localhost')
    if (!url.pathname.startsWith('/api/v1/'))
      return Promise.reject(new TypeError(`테스트에서 막은 요청: ${raw}`))
    return handleMockRequest(
      input instanceof Request ? input : new Request(url, init),
    )
  })
  // 브라우저처럼 axios도 fetch를 거치게 한다 (src/mock/index.ts의 installMock과 같다)
  backendApi.defaults.adapter = 'fetch'
  // axios는 fetch를 부르기 전에 주소로 Request를 직접 만든다. Node에는 기준 주소가 없어 상대 주소가 실패하므로 채운다
  backendApi.defaults.baseURL = 'http://localhost'
}

/** 로그인한 상태로 만든다. 저장소는 테스트마다 비워지므로 각 테스트 앞에서 부른다 */
export const signIn = () =>
  sessionStorage.setItem(
    LOCAL_STORAGE_KEY.ACCESS_TOKEN,
    JSON.stringify(fakeToken()),
  )

/** 서버에 빈 대화를 하나 만들고 id를 돌려준다 */
export const createSession = () => {
  const id = newId()
  db.sessions.unshift({
    session_id: id,
    title: '테스트 대화',
    updated_at: now(),
    is_favorite: false,
    project_id: null,
  })
  db.messages[id] = []
  return id
}

/**
 * 지금부터 나가는 요청을 모은다. 돌려받은 함수를 부르면 그동안의 요청을 "메서드 경로" 목록으로 준다 (쿼리 문자열 제외).
 *
 *   const sent = watchRequests()
 *   await 무언가()
 *   expect(sent()).toEqual(['GET /sessions/1/messages'])
 */
export const watchRequests = () => {
  const from = lastRequestSeq()
  return () =>
    requestRecords()
      .filter((record) => record.seq > from)
      .map((record) => `${record.method} ${record.path.split('?')[0]}`)
}

/** 서버(mock 저장소)에 남은 메시지 */
export const serverMessages = (sessionId: string) => db.messages[sessionId]
