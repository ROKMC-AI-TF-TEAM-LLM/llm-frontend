// 같은 모듈을 두 번 이상 가져오는 import를 하나로 합친다 (이름 있는 import만; 기본·전체 import가 섞이면 건드리지 않는다)
import fs from 'node:fs'

const RE =
  /^import(\s+type)?\s*\{([^}]*)\}\s*from\s*(['"])([^'"]+)\3(;?)[ \t]*\r?\n/gm

for (const file of process.argv.slice(2)) {
  let src = fs.readFileSync(file, 'utf8')
  const bySource = new Map()
  for (const m of src.matchAll(RE)) {
    const [text, typeKw, inner, q, from, semi] = m
    if (!bySource.has(from)) bySource.set(from, [])
    bySource.get(from).push({ text, typeKw: !!typeKw, inner, q, semi })
  }
  let changed = false
  for (const [from, list] of bySource) {
    if (list.length < 2) continue
    const names = []
    for (const s of list) {
      for (const raw of s.inner
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)) {
        const isType = s.typeKw || raw.startsWith('type ')
        const bare = raw.replace(/^type\s+/, '')
        if (!names.some((n) => n.bare === bare)) names.push({ bare, isType })
      }
    }
    const allType = names.every((n) => n.isType)
    const parts = names.map((n) =>
      allType || !n.isType ? n.bare : `type ${n.bare}`,
    )
    const { q, semi } = list[0]
    const merged = `import${allType ? ' type' : ''} { ${parts.join(', ')} } from ${q}${from}${q}${semi}\n`
    src = src.replace(list[0].text, merged)
    for (const s of list.slice(1)) src = src.replace(s.text, '')
    changed = true
  }
  if (changed) {
    fs.writeFileSync(file, src)
    console.log('합침:', file)
  }
}
