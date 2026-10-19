// `npm run dev:mock`(vite --mode mock)에서만 main.tsx가 불러온다. 일반 빌드에는 포함되지 않는다.
//
// 브라우저의 fetch를 가로채 `/api/v1/*` 요청을 메모리 안의 가짜 서버로 보낸다.
// axios·SSE 스트리밍·파일 다운로드가 모두 fetch를 거치므로, 서비스 코드에는 mock 분기가 필요 없다.

import { backendApi } from '../api/lib/axios'
import { authRoutes } from './handlers/auth'
import { documentRoutes } from './handlers/documents'
import { miscRoutes } from './handlers/misc'
import { projectRoutes } from './handlers/projects'
import { sessionRoutes } from './handlers/sessions'
import { userRoutes } from './handlers/users'
import { createServer } from './server'

const handle = createServer([
  ...authRoutes,
  ...userRoutes,
  ...sessionRoutes,
  ...projectRoutes,
  ...documentRoutes,
  ...miscRoutes,
])

const urlOf = (input: RequestInfo | URL) =>
  new URL(input instanceof Request ? input.url : String(input), window.location.href)

export function installMock() {
  const realFetch = window.fetch.bind(window)

  window.fetch = (input, init) =>
    urlOf(input).pathname.startsWith('/api/v1/')
      ? handle(new Request(input, init))
      : realFetch(input, init)

  // axios 기본 어댑터(XHR)는 fetch를 거치지 않으므로 fetch 어댑터로 바꾼다.
  backendApi.defaults.adapter = 'fetch'

  console.info('[mock] 백엔드 없이 실행 중입니다. 응답은 src/mock/handlers에서 수정할 수 있습니다.')
}
