// src 아래 파일들의 내부 import 관계를 뽑는다: 파일 → (가져오는 파일들), 그리고 역방향(누가 이 파일을 쓰는지)
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2], 'src')
const files = []
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (/\.(ts|tsx|css)$/.test(e.name)) files.push(p)
  }
}
walk(root)

const rel = (p) => path.relative(root, p).split(path.sep).join('/')
const exts = ['', '.ts', '.tsx', '.d.ts', '/index.ts', '/index.tsx']
const resolve = (from, spec) => {
  if (!spec.startsWith('.')) return null
  const base = path.resolve(path.dirname(from), spec)
  for (const e of exts)
    if (fs.existsSync(base + e) && fs.statSync(base + e).isFile())
      return base + e
  return 'UNRESOLVED:' + spec
}
const RE =
  /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g

const deps = {}
const users = {}
for (const f of files) {
  if (f.endsWith('.css')) continue
  const src = fs.readFileSync(f, 'utf8')
  const out = new Set()
  for (const m of src.matchAll(RE)) {
    const spec = m[1] ?? m[2] ?? m[3]
    const r = resolve(f, spec)
    if (r) out.add(r.startsWith('UNRESOLVED') ? r : rel(r))
  }
  deps[rel(f)] = [...out]
  for (const d of out) (users[d] ??= []).push(rel(f))
}

const mode = process.argv[3]
if (mode === 'users') {
  for (const f of Object.keys(deps).sort())
    console.log(`${f}  <=  ${(users[f] ?? []).join(', ') || '(none)'}`)
} else {
  for (const f of Object.keys(deps).sort())
    console.log(`${f}  =>  ${deps[f].join(', ')}`)
}
