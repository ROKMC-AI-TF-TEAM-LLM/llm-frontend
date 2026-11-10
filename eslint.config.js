import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// 구조 규칙 (ARCHITECTURE.md 참고). 같은 규칙을 덮어쓰면 합쳐지지 않으므로 공통 항목을 상수로 둔다.
const ROUTER_RULE = { name: 'react-router', message: 'react-router-dom에서 가져오세요.' }
const MOCK_RULE = { group: ['**/mock', '**/mock/*'], message: 'mock 코드는 src/mock 안과 main.tsx에서만 씁니다.' }
const SERVICE_RULE = {
  group: ['**/api/services/*'],
  message: '화면에서는 서버를 직접 부르지 말고 hooks/의 React Query 훅을 쓰세요. (순수 함수는 utils/로)',
}

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/mock/**', 'src/main.tsx'],
    rules: {
      'no-restricted-imports': ['error', { paths: [ROUTER_RULE], patterns: [MOCK_RULE] }],
    },
  },
  {
    // 화면 쪽(pages·ui·features)은 서비스를 훅으로만 쓴다
    files: ['src/pages/**/*.{ts,tsx}', 'src/ui/**/*.{ts,tsx}', 'src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { paths: [ROUTER_RULE], patterns: [MOCK_RULE, SERVICE_RULE] }],
    },
  },
])
