import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { claudeProxy } from './mock-server/claudeProxy'
import { docsServer } from './mock-server/docsServer'

const nodeModule = (names: string) =>
  new RegExp(`[\\\\/]node_modules[\\\\/](${names})[\\\\/]`)
const markdownModules = nodeModule(
  'streamdown|marked|parse5|entities|unified|remend|rehype-[^/\\\\]+|remark-[^/\\\\]+|micromark[^/\\\\]*|mdast-[^/\\\\]+|hast[^/\\\\]*|unist-[^/\\\\]+|vfile[^/\\\\]*|property-information',
)

export default defineConfig({
  // claudeProxy: dev:mock에서 ANTHROPIC_API_KEY가 있으면 mock 채팅을 실제 Claude로 응답하게 한다
  // docsServer: dev:mock에서 mock-docs/의 실제 문서를 자료실 문서로 보여 준다
  plugins: [react(), tailwindcss(), claudeProxy(), docsServer()],
  resolve: {
    // 영역을 넘는 import는 '@/...' (tsconfig.app.json의 paths와 같게)
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rolldownOptions: {
      output: {
        // 자주 바뀌지 않는 라이브러리를 앱 코드와 떼어 둔다. 앱만 바뀐 배포에서는 브라우저 캐시를 그대로 쓴다.
        // 그룹은 처음 쓰이는 화면이 열릴 때 받는다(markdown은 채팅 화면을 열 때).
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: nodeModule(
                'react|react-dom|scheduler|react-router|react-router-dom',
              ),
            },
            {
              name: 'form',
              test: nodeModule('zod|react-hook-form|@hookform/[^/\\\\]+'),
            },
            // streamdown(채팅 말풍선의 마크다운 렌더러)과 그 의존성.
            // CSS는 빼야 한다. main.tsx가 streamdown/styles.css를 가져오므로, 넣으면 첫 화면이 이 묶음을 통째로 받는다.
            {
              name: 'markdown',
              test: (id: string) =>
                !id.endsWith('.css') && markdownModules.test(id),
            },
          ],
        },
      },
    },
  },
})
