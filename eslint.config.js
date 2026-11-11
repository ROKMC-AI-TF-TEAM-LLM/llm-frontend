import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// 구조 규칙 (ARCHITECTURE.md 참고). 같은 규칙을 덮어쓰면 합쳐지지 않으므로 공통 항목을 상수로 둔다.
const ROUTER_RULE = { name: 'react-router', message: 'react-router-dom에서 가져오세요.' }
const MOCK_RULE = { group: ['**/mock', '**/mock/*'], message: 'mock 코드는 src/mock 안과 main.tsx에서만 씁니다.' }
const API_RULE = {
  group: ['**/api', '!@/lib/**'],
  message: '화면에서는 서버를 직접 부르지 말고 기능의 hooks.ts(React Query 훅)를 쓰세요. 순수 함수는 utils.ts로.',
}
const SHARED_RULE = {
  group: ['@/features/*', '@/features/**', '@/app/*', '@/app/**'],
  message: 'shared는 어느 기능에도 기대지 않는 공용 코드만 둡니다. 기능 코드가 필요하면 그 기능 폴더로 옮기세요.',
}
const LIB_RULE = {
  group: ['@/features/*', '@/features/**', '@/app/*', '@/app/**'],
  message: 'lib는 모든 기능이 기대는 기반입니다. 기능·app 코드를 가져오지 말고, 필요한 타입은 lib에 두세요.',
}

// 기능 폴더 사이의 의존 방향. 왼쪽 기능은 오른쪽 기능을 가져오지 않는다(서로 가져다 쓰는 순환을 막는다).
// 양쪽이 함께 쓰는 코드는 한쪽 또는 shared로 옮긴다.
const FEATURE_DIRECTION = {
  sessions: ['chat'],
  auth: ['users'],
  landing: ['auth'],
  domains: ['documents'],
}
const directionRule = (from, targets) => ({
  group: targets.flatMap((t) => [`@/features/${t}`, `@/features/${t}/**`]),
  message: `${from} 기능은 ${targets.join('·')} 기능을 가져오지 않습니다(순환 참조). 함께 쓰는 코드는 한쪽 또는 shared로 옮기세요.`,
})
// 같은 규칙을 덮어쓰면 합쳐지지 않으므로, 화면 쪽(components·pages)과 그 밖을 나눠 기존 항목과 함께 적는다.
const featureDirectionConfigs = Object.entries(FEATURE_DIRECTION).flatMap(([from, targets]) => [
  {
    files: [`src/features/${from}/**/*.{ts,tsx}`],
    ignores: [`src/features/${from}/components/**`, `src/features/${from}/pages/**`],
    rules: { 'no-restricted-imports': ['error', { paths: [ROUTER_RULE], patterns: [MOCK_RULE, directionRule(from, targets)] }] },
  },
  {
    files: [`src/features/${from}/components/**/*.{ts,tsx}`, `src/features/${from}/pages/**/*.{ts,tsx}`],
    rules: { 'no-restricted-imports': ['error', { paths: [ROUTER_RULE], patterns: [MOCK_RULE, API_RULE, directionRule(from, targets)] }] },
  },
])

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
    // 화면 쪽(app·shared·기능의 components·pages)은 서버를 훅으로만 쓴다
    files: ['src/app/**/*.{ts,tsx}', 'src/features/*/components/**/*.{ts,tsx}', 'src/features/*/pages/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { paths: [ROUTER_RULE], patterns: [MOCK_RULE, API_RULE] }],
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { paths: [ROUTER_RULE], patterns: [MOCK_RULE, API_RULE, SHARED_RULE] }],
    },
  },
  {
    files: ['src/lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { paths: [ROUTER_RULE], patterns: [MOCK_RULE, LIB_RULE] }],
    },
  },
  ...featureDirectionConfigs,
])
