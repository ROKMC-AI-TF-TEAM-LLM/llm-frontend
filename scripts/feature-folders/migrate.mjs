// 기능별 폴더로 옮기기: 파일을 git mv 하고, 모든 import 경로를 새 위치 기준으로 다시 계산한다.
//   - 같은 영역(features/<x>, app, shared, lib, mock) 안은 상대 경로, 영역을 넘으면 '@/...'
//   - SPLIT: 한 파일을 기호 단위로 둘로 나눌 때, 그 기호를 가져오는 import도 나눈다
//   - 합치는 파일(MERGE)은 임시 이름으로 옮겨 두고, 내용 합치기는 손으로 한다
// 사용: node migrate.mjs <repo> [--dry]
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const repo = path.resolve(process.argv[2])
const DRY = process.argv.includes('--dry')
const SRC = path.join(repo, 'src')

/* ───────── 옮길 위치 (src 기준) ───────── */
const MAP = {
  // 앱 뼈대
  'App.tsx': 'app/App.tsx',
  'pages/ErrorPage.tsx': 'app/ErrorPage.tsx',
  'ui/layouts/AuthLayout.tsx': 'app/layouts/AuthLayout.tsx',
  'ui/layouts/ProtectedLayout.tsx': 'app/layouts/ProtectedLayout.tsx',
  'ui/layouts/AdminLayout.tsx': 'app/layouts/AdminLayout.tsx',
  'utils/vite-env.d.ts': 'vite-env.d.ts',
  // 기반
  'api/lib/axios.ts': 'lib/axios.ts',
  'api/queryClient.ts': 'lib/queryClient.ts',
  'constants/key.ts': 'lib/storageKeys.ts',
  // 공용
  'ui/components/DevToast.tsx': 'shared/components/DevToast.tsx',
  'ui/components/ErrorBoundary.tsx': 'shared/components/ErrorBoundary.tsx',
  'ui/components/Skeleton.tsx': 'shared/components/Skeleton.tsx',
  'ui/components/Toast.tsx': 'shared/components/Toast.tsx',
  'ui/components/ToastHost.tsx': 'shared/components/ToastHost.tsx',
  'hooks/useDocumentTitle.ts': 'shared/hooks/useDocumentTitle.ts',
  'hooks/useLocalStorage.ts': 'shared/hooks/useLocalStorage.ts',
  'store/toastStore.ts': 'shared/store/toastStore.ts',
  'utils/chunkReload.ts': 'shared/utils/chunkReload.ts',
  'utils/clipboard.ts': 'shared/utils/clipboard.ts',
  'utils/error.ts': 'shared/utils/error.ts',
  'utils/logError.ts': 'shared/utils/logError.ts',
  'utils/uuid.ts': 'shared/utils/uuid.ts',
  'utils/downloadAttachment.ts': 'shared/utils/downloadAttachment.ts',
  'types/api.ts': 'shared/types/api.ts',
  'ui/styles/global.css': 'shared/styles/global.css',
  // 로그인
  'api/services/auth.ts': 'features/auth/api.ts',
  'types/auth.ts': 'features/auth/types.ts',
  'context/AuthContext.tsx': 'features/auth/AuthContext.tsx',
  'utils/postLoginRedirect.ts': 'features/auth/utils.ts',
  'pages/LoginPage.tsx': 'features/auth/pages/LoginPage.tsx',
  // 사용자
  'api/services/user.ts': 'features/users/api.ts',
  'hooks/useUser.ts': 'features/users/hooks.ts',
  'types/user.ts': 'features/users/types.ts',
  // 관리자
  'api/services/adminDocument.ts': 'features/admin/api.ts',
  'hooks/useAdminDocument.ts': 'features/admin/hooks.ts',
  'types/adminDocument.ts': 'features/admin/types.ts',
  'pages/AdminPage.tsx': 'features/admin/pages/AdminPage.tsx',
  'pages/AdminDocuments.tsx': 'features/admin/components/AdminDocuments.tsx',
  // 채팅
  'api/services/chat.ts': 'features/chat/api.ts',
  'types/chat.ts': 'features/chat/types.ts',
  'types/index.ts': 'features/chat/types.ts', // MERGE
  'store/chatStore.ts': 'features/chat/store.ts',
  'ui/components/chat/ChatInput.tsx': 'features/chat/components/ChatInput.tsx',
  'ui/components/chat/DomainPicker.tsx':
    'features/chat/components/DomainPicker.tsx',
  'pages/ChatPage.tsx': 'features/chat/pages/ChatPage.tsx',
  'pages/NewChatPage.tsx': 'features/chat/pages/NewChatPage.tsx',
  // 대화 목록·검색
  'api/services/session.ts': 'features/sessions/api.ts',
  'hooks/useSession.ts': 'features/sessions/hooks.ts',
  'types/session.ts': 'features/sessions/types.ts',
  'utils/sessionTitle.ts': 'features/sessions/utils.ts',
  'pages/SearchPage.tsx': 'features/sessions/pages/SearchPage.tsx',
  // 문서 검색
  'api/services/document.ts': 'features/documents/api.ts',
  'hooks/useDocument.ts': 'features/documents/hooks.ts',
  'hooks/useDocumentDrawer.ts': 'features/documents/useDocumentDrawer.ts',
  'types/document.ts': 'features/documents/types.ts',
  'utils/document.ts': 'features/documents/utils.ts', // SPLIT (분야 부분은 domains로)
  'pages/RagPage.tsx': 'features/documents/pages/RagPage.tsx',
  // 분야
  'api/services/capability.ts': 'features/domains/api.ts',
  'hooks/useCapabilities.ts': 'features/domains/hooks.ts',
  'types/capability.ts': 'features/domains/types.ts',
  'ui/components/chat/DomainIcon.tsx':
    'features/domains/components/DomainIcon.tsx',
  // 프로젝트
  'api/services/project.ts': 'features/projects/api.ts',
  'hooks/useProject.ts': 'features/projects/hooks.ts',
  'types/project.ts': 'features/projects/types.ts',
  'features/projects/types.ts': 'features/projects/types.ts', // MERGE
  'features/projects/projectStore.ts': 'features/projects/store.ts',
  'features/projects/ui.tsx': 'features/projects/components/parts.tsx',
  'features/projects/icons.tsx': 'features/projects/components/icons.tsx',
  'pages/projects/ProjectPage.tsx': 'features/projects/pages/ProjectPage.tsx',
  // 문서 제작
  'api/services/docgen.ts': 'features/docgen/api.ts',
  'hooks/useDocGen.ts': 'features/docgen/hooks.ts',
  'features/docgen/hooks.ts': 'features/docgen/hooks.ts', // MERGE
  'types/docgen.ts': 'features/docgen/types.ts',
  'utils/docgen.ts': 'features/docgen/utils.ts',
  'features/docgen/components.tsx': 'features/docgen/components/parts.tsx',
  'features/docgen/icons.tsx': 'features/docgen/components/icons.tsx',
  'pages/docgen/DocGenPage.tsx': 'features/docgen/pages/DocGenPage.tsx',
  // 번역
  'api/services/translate.ts': 'features/translate/api.ts',
  'hooks/useTranslate.ts': 'features/translate/hooks.ts',
  'types/translate.ts': 'features/translate/types.ts',
  'pages/TranslatePage.tsx': 'features/translate/pages/TranslatePage.tsx',
  // 시스템 진단
  'api/services/health.ts': 'features/system/api.ts',
  'hooks/useServerStatus.ts': 'features/system/hooks.ts',
  'utils/telemetry.ts': 'features/system/telemetry.ts',
  'pages/SystemDiagnostics.tsx': 'features/system/pages/SystemDiagnostics.tsx',
  // 소개 페이지
  'ui/components/MarsPlanet.tsx': 'features/landing/components/MarsPlanet.tsx',
  'pages/GuidePage.tsx': 'features/landing/pages/GuidePage.tsx',
  // 팀·튜토리얼
  'features/team/AnchorMark.tsx': 'features/team/components/AnchorMark.tsx',
  'features/team/KeywordConstellation.tsx':
    'features/team/components/KeywordConstellation.tsx',
  'features/team/ScrollFade.tsx': 'features/team/components/ScrollFade.tsx',
  'pages/TeamPage.tsx': 'features/team/pages/TeamPage.tsx',
  'features/tutorials/parts.tsx': 'features/tutorials/components/parts.tsx',
  'pages/TutorialsPage.tsx': 'features/tutorials/pages/TutorialsPage.tsx',
  'pages/TutorialPage.tsx': 'features/tutorials/pages/TutorialPage.tsx',
}
// 폴더째 옮기는 것
const DIRS = {
  'ui/components/sidebar/': 'app/sidebar/',
  'ui/components/messages/': 'features/chat/components/',
  'ui/components/search/': 'features/sessions/components/',
  'ui/components/rag/': 'features/documents/components/',
  'ui/components/landing/': 'features/landing/components/',
  'features/team/sections/': 'features/team/components/sections/',
}

/** 기호 단위로 나누는 파일: { 옛 파일: { 새 파일: [기호들] } }. 나머지 기호는 MAP 위치로 */
const SPLIT = {
  'utils/document.ts': {
    'features/domains/utils.ts': [
      'DomainStyle',
      'getDomainStyle',
      'DOMAINS',
      'getDomainLabel',
    ],
  },
  'types/index.ts': { 'shared/types/attachment.ts': ['FileAttachment'] },
}

/** 같은 곳으로 합쳐지는 파일 중 '나중에 합칠 쪽'은 임시 이름으로 옮겨 둔다 */
const MERGE_TEMP = {
  'types/index.ts': 'features/chat/types.merge-index.ts',
  'types/project.ts': 'features/projects/types.merge-api.ts',
  'hooks/useDocGen.ts': 'features/docgen/hooks.merge-data.ts',
}

/* ───────── 파일 목록 ───────── */
const rel = (p) => path.relative(SRC, p).split(path.sep).join('/')
const all = []
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else all.push(rel(p))
  }
}
walk(SRC)

const target = (old) => {
  if (MAP[old]) return MAP[old]
  for (const [from, to] of Object.entries(DIRS))
    if (old.startsWith(from)) return to + old.slice(from.length)
  return old
}
const place = (old) => MERGE_TEMP[old] ?? target(old)

// 같은 자리에 두 파일이 오면(합치기 제외) 멈춘다
const seen = {}
for (const f of all) {
  const p = place(f)
  if (seen[p]) throw new Error(`자리 겹침: ${f}, ${seen[p]} -> ${p}`)
  seen[p] = f
}

/* ───────── import 다시 쓰기 ───────── */
const EXTS = ['', '.ts', '.tsx', '.d.ts', '/index.ts', '/index.tsx']
const resolveOld = (fromOld, spec) => {
  const base = path.resolve(path.dirname(path.join(SRC, fromOld)), spec)
  for (const e of EXTS) {
    const p = base + e
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return rel(p)
  }
  throw new Error(`못 찾음: ${fromOld} -> ${spec}`)
}
const area = (p) => {
  const s = p.split('/')
  if (s[0] === 'features') return s.slice(0, 2).join('/')
  return s.length > 1 ? s[0] : '(root)'
}
const specFor = (fromNew, toNew) => {
  const keepExt = !/\.(ts|tsx)$/.test(toNew)
  const noExt = keepExt ? toNew : toNew.replace(/\.(d\.)?tsx?$/, '')
  if (area(fromNew) === area(toNew) && area(fromNew) !== '(root)') {
    let r = path.posix.relative(path.posix.dirname(fromNew), noExt)
    if (!r.startsWith('.')) r = './' + r
    return r
  }
  return '@/' + noExt
}

/** `type A, B as C, type D` → [{name:'A', text:'A', type:false}, …] */
const parseNames = (inner) =>
  inner
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((text) => {
      const isType = text.startsWith('type ')
      const name = text
        .replace(/^type\s+/, '')
        .split(/\s+as\s+/)[0]
        .trim()
      return { text, name, isType }
    })

const STMT =
  /(^|\n)([ \t]*)(import|export)(\s+type)?\s+(\{[^}]*\}|[\w$]+(?:\s*,\s*\{[^}]*\})?|\*\s+as\s+[\w$]+|\*)\s+from\s+(['"])([^'"]+)\6(;?)/g
const SIDE = /(^|\n)([ \t]*)import\s+(['"])([^'"]+)\3(;?)/g
const DYN = /import\(\s*(['"])([^'"]+)\1\s*\)/g

const rewrite = (old, src) => {
  const fromNew = target(old)
  const fix = (spec) =>
    spec.startsWith('.')
      ? specFor(fromNew, target(resolveOld(old, spec)))
      : spec

  src = src.replace(
    STMT,
    (m, lead, indent, kw, typeKw, clause, q, spec, semi) => {
      if (!spec.startsWith('.')) return m
      const oldTarget = resolveOld(old, spec)
      const split = SPLIT[oldTarget]
      if (!split || !clause.startsWith('{')) {
        if (split && !clause.startsWith('{'))
          throw new Error(`나누는 파일을 기본/전체 import: ${old}`)
        return `${lead}${indent}${kw}${typeKw ?? ''} ${clause} from ${q}${fix(spec)}${q}${semi}`
      }
      // 기호별로 새 파일을 정해 import를 나눈다
      const groups = new Map()
      for (const n of parseNames(clause.slice(1, -1))) {
        const dest =
          Object.entries(split).find(([, names]) =>
            names.includes(n.name),
          )?.[0] ?? target(oldTarget)
        if (!groups.has(dest)) groups.set(dest, [])
        groups.get(dest).push(n.text)
      }
      return [...groups.entries()]
        .map(
          ([dest, names], i) =>
            `${i === 0 ? lead : '\n'}${indent}${kw}${typeKw ?? ''} { ${names.join(', ')} } from ${q}${specFor(fromNew, dest)}${q}${semi}`,
        )
        .join('')
    },
  )
  src = src.replace(SIDE, (m, lead, indent, q, spec, semi) =>
    spec.startsWith('.')
      ? `${lead}${indent}import ${q}${fix(spec)}${q}${semi}`
      : m,
  )
  src = src.replace(DYN, (m, q, spec) =>
    spec.startsWith('.') ? `import(${q}${fix(spec)}${q})` : m,
  )
  return src
}

const out = {}
for (const f of all) {
  if (!/\.(ts|tsx)$/.test(f)) continue
  out[f] = rewrite(f, fs.readFileSync(path.join(SRC, f), 'utf8'))
}

/* ───────── 옮기고 쓰기 ───────── */
const moves = all.filter((f) => place(f) !== f)
console.log(`옮길 파일 ${moves.length}개 / 전체 ${all.length}개`)
if (DRY) {
  for (const f of moves) console.log(`  ${f} -> ${place(f)}`)
  process.exit(0)
}
const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' })
for (const f of moves) {
  const to = path.join(SRC, place(f))
  fs.mkdirSync(path.dirname(to), { recursive: true })
  git('mv', path.join('src', f), path.join('src', place(f)))
}
for (const [f, text] of Object.entries(out))
  fs.writeFileSync(path.join(SRC, place(f)), text)

// 빈 폴더 정리
const prune = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true }))
    if (e.isDirectory()) prune(path.join(d, e.name))
  if (d !== SRC && fs.readdirSync(d).length === 0) fs.rmdirSync(d)
}
prune(SRC)
console.log('완료')
