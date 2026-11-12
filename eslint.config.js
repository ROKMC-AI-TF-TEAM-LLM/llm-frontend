import { readdirSync } from 'node:fs'
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier/flat'

// 구조 규칙 (ARCHITECTURE.md 참고). 같은 규칙을 덮어쓰면 합쳐지지 않으므로 공통 항목을 상수로 둔다.
const ROUTER_RULE = {
  name: 'react-router',
  message: 'react-router-dom에서 가져오세요.',
}
const MOCK_RULE = {
  group: ['**/mock', '**/mock/*'],
  message: 'mock 코드는 src/mock 안과 main.tsx에서만 씁니다.',
}
const API_RULE = {
  group: ['**/api', '!@/lib/**'],
  message:
    '화면에서는 서버를 직접 부르지 말고 기능의 hooks.ts(React Query 훅)를 쓰세요. 순수 함수는 utils.ts로.',
}
const SHARED_RULE = {
  group: ['@/features/*', '@/features/**', '@/app/*', '@/app/**'],
  message:
    'shared는 어느 기능에도 기대지 않는 공용 코드만 둡니다. 기능 코드가 필요하면 그 기능 폴더로 옮기세요.',
}
const LIB_RULE = {
  group: ['@/features/*', '@/features/**', '@/app/*', '@/app/**'],
  message:
    'lib는 모든 기능이 기대는 기반입니다. 기능·app 코드를 가져오지 말고, 필요한 타입은 lib에 두세요.',
}

// 기능 폴더 사이의 의존 방향 (허용 목록). 왼쪽 기능은 오른쪽에 적힌 기능만 가져올 수 있다.
// 여기에 없는 방향은 lint 오류다. 새 기능을 만들거나 다른 기능을 가져다 쓰게 되면 이 표에 적는다.
// 서로 가져다 쓰는 순환이 생기면(직접이든 여러 단계를 거치든) 설정을 읽을 때 바로 오류가 난다.
// 양쪽이 함께 쓰는 코드는 한쪽 또는 shared로 옮긴다.
const FEATURE_DEPS = {
  admin: ['auth', 'documents', 'domains', 'users'],
  auth: [],
  chat: ['documents', 'domains', 'sessions', 'system', 'users'],
  docgen: ['auth', 'documents', 'domains'],
  documents: ['auth', 'domains'],
  domains: [],
  home: ['auth', 'landing', 'team'],
  landing: ['domains'],
  projects: ['auth', 'chat', 'documents', 'sessions'],
  sessions: ['auth'],
  system: ['team'],
  team: ['landing'],
  translate: [],
  users: ['auth'],
}

// src/features의 실제 폴더와 표가 어긋나면(표에 없는 폴더, 없는 기능 이름) 알려 준다
const FEATURES = readdirSync(new URL('./src/features', import.meta.url), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
for (const feature of FEATURES) {
  if (!FEATURE_DEPS[feature])
    throw new Error(
      `eslint.config.js: FEATURE_DEPS에 '${feature}' 기능이 없습니다. 가져다 쓰는 기능 목록을 적으세요(없으면 []).`,
    )
}
for (const [from, targets] of Object.entries(FEATURE_DEPS)) {
  for (const name of [from, ...targets]) {
    if (!FEATURES.includes(name))
      throw new Error(
        `eslint.config.js: FEATURE_DEPS의 '${name}'은(는) src/features에 없는 기능입니다.`,
      )
  }
}

// 표 자체에 순환이 있으면 멈춘다
const findCycle = (feature, path = []) => {
  if (path.includes(feature))
    return [...path.slice(path.indexOf(feature)), feature]
  for (const next of FEATURE_DEPS[feature]) {
    const cycle = findCycle(next, [...path, feature])
    if (cycle) return cycle
  }
  return null
}
for (const feature of FEATURES) {
  const cycle = findCycle(feature)
  if (cycle)
    throw new Error(
      `eslint.config.js: FEATURE_DEPS에 순환 참조가 있습니다: ${cycle.join(' → ')}`,
    )
}

const directionRule = (from) => {
  const allowed = FEATURE_DEPS[from]
  const forbidden = FEATURES.filter((f) => f !== from && !allowed.includes(f))
  return {
    group: forbidden.flatMap((t) => [`@/features/${t}`, `@/features/${t}/**`]),
    message: `${from} 기능이 가져올 수 있는 기능은 ${allowed.length ? allowed.join('·') : '없습니다(shared·lib만)'}${allowed.length ? '뿐입니다' : ''}. 꼭 필요하면 eslint.config.js의 FEATURE_DEPS에 방향을 적고(순환 금지), 함께 쓰는 코드는 shared로 옮기세요.`,
  }
}

// 같은 규칙을 덮어쓰면 합쳐지지 않으므로, 화면 쪽(components·pages)과 그 밖을 나눠 기존 항목과 함께 적는다.
const featureDirectionConfigs = FEATURES.flatMap((from) => [
  {
    files: [`src/features/${from}/**/*.{ts,tsx}`],
    ignores: [
      `src/features/${from}/components/**`,
      `src/features/${from}/pages/**`,
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [ROUTER_RULE],
          patterns: [MOCK_RULE, directionRule(from)],
        },
      ],
    },
  },
  {
    files: [
      `src/features/${from}/components/**/*.{ts,tsx}`,
      `src/features/${from}/pages/**/*.{ts,tsx}`,
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [ROUTER_RULE],
          patterns: [MOCK_RULE, API_RULE, directionRule(from)],
        },
      ],
    },
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
      'no-restricted-imports': [
        'error',
        { paths: [ROUTER_RULE], patterns: [MOCK_RULE] },
      ],
    },
  },
  {
    // 화면 쪽(app·shared·기능의 components·pages)은 서버를 훅으로만 쓴다
    files: [
      'src/app/**/*.{ts,tsx}',
      'src/features/*/components/**/*.{ts,tsx}',
      'src/features/*/pages/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: [ROUTER_RULE], patterns: [MOCK_RULE, API_RULE] },
      ],
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: [ROUTER_RULE], patterns: [MOCK_RULE, API_RULE, SHARED_RULE] },
      ],
    },
  },
  {
    files: ['src/lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: [ROUTER_RULE], patterns: [MOCK_RULE, LIB_RULE] },
      ],
    },
  },
  ...featureDirectionConfigs,
  {
    // 테스트는 앱 코드를 mock 서버에 붙여 확인하므로 mock을 가져다 쓸 수 있다 (src/test/mockBackend.ts)
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { paths: [ROUTER_RULE] }],
    },
  },
  // 포맷은 Prettier가 맡는다. 포맷과 겹치는 ESLint 규칙은 끈다 (맨 뒤에 둬야 한다)
  eslintConfigPrettier,
])
