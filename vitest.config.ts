import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// 테스트 설정. 앱 빌드 설정(vite.config.ts)의 개발 서버 플러그인은 테스트에 필요 없어서 따로 둔다.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.test.ts'],
    // 화면을 그리지 않는 로직 테스트만 있으므로 브라우저 흉내(jsdom 등) 없이 Node에서 돈다.
    // 브라우저 저장소는 src/test/setup.ts가 채운다.
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    // .env의 실제 서버 주소를 쓰지 않는다. 요청은 상대 경로(/api/v1/...)로 나가 테스트가 가로챈다.
    env: { VITE_SERVER_API_URL: '' },
    // 개발 모드용 확인 로그(features/chat/api.ts)는 테스트 출력에서 뺀다
    onConsoleLog: (log) => !log.startsWith('[SSE sources]'),
  },
})
