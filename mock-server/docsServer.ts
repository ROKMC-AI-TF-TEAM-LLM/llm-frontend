// `npm run dev:mock`에서만 켜지는 Vite 플러그인. mock-docs/ 폴더의 실제 문서를 mock 자료실에 보여 준다.
//
// - 폴더 구조: mock-docs/<분야 코드>/<파일> (분야 코드는 src/features/domains/utils.ts의 code와 같다)
// - GET /__mock/docs                         문서 목록 (분야, 파일명, 크기, 수정 시각)
// - GET /__mock/docs/file?domain=..&name=..  파일 원본
// - 요청마다 폴더를 다시 읽으므로 파일을 넣고 빼도 개발 서버를 다시 켤 필요가 없다(화면만 새로고침).
// - 정적 빌드(build:mock)에는 이 중계가 없어서, src/mock은 기존 가짜 문서 목록을 쓴다.
import { createReadStream } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import type { ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

export const DOCS_DIR = 'mock-docs'

const CONTENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.hwp': 'application/x-hwp',
  '.hwpx': 'application/haansofthwpx',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pptx':
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain; charset=utf-8',
}

const contentTypeOf = (name: string) =>
  CONTENT_TYPES[path.extname(name).toLowerCase()] ?? 'application/octet-stream'

/** 분야 폴더 이름과 파일 이름이 폴더 밖을 가리키지 않는지 */
const isSafeDomain = (domain: string) => /^[A-Z][A-Z0-9_]*$/.test(domain)
const isSafeName = (name: string) =>
  name !== '' && path.basename(name) === name && !name.startsWith('.')

export interface MockDocFile {
  domain: string
  name: string
  size: number
  contentType: string
  modifiedAt: string
}

export const listDocs = async (root: string): Promise<MockDocFile[]> => {
  const domains = await readdir(root, { withFileTypes: true }).catch(() => [])
  const files: MockDocFile[] = []
  for (const dir of domains) {
    if (!dir.isDirectory() || !isSafeDomain(dir.name)) continue
    const entries = await readdir(path.join(root, dir.name), {
      withFileTypes: true,
    })
    for (const entry of entries) {
      if (!entry.isFile() || !isSafeName(entry.name)) continue
      const info = await stat(path.join(root, dir.name, entry.name))
      files.push({
        domain: dir.name,
        name: entry.name,
        size: info.size,
        contentType: contentTypeOf(entry.name),
        modifiedAt: info.mtime.toISOString(),
      })
    }
  }
  return files.sort(
    (a, b) => a.domain.localeCompare(b.domain) || a.name.localeCompare(b.name),
  )
}

const sendJson = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

export function docsServer(): Plugin {
  return {
    name: 'mock-docs-server',
    apply: 'serve',
    configureServer(server) {
      if (server.config.mode !== 'mock') return
      const root = path.resolve(server.config.root, DOCS_DIR)

      // '/__mock/docs/file'을 먼저 등록한다. connect는 접두사로 고르므로 순서가 바뀌면 목록 쪽이 가로챈다
      server.middlewares.use('/__mock/docs/file', async (req, res) => {
        const query = new URL(req.url ?? '', 'http://localhost').searchParams
        const domain = query.get('domain') ?? ''
        const name = query.get('name') ?? ''
        if (!isSafeDomain(domain) || !isSafeName(name))
          return sendJson(res, 400, { message: '잘못된 문서 경로입니다.' })

        const filePath = path.join(root, domain, name)
        const info = await stat(filePath).catch(() => null)
        if (!info?.isFile())
          return sendJson(res, 404, { message: '문서를 찾을 수 없습니다.' })

        res.statusCode = 200
        res.setHeader('Content-Type', contentTypeOf(name))
        res.setHeader('Content-Length', info.size)
        createReadStream(filePath).pipe(res)
      })

      server.middlewares.use('/__mock/docs', async (_req, res) => {
        sendJson(res, 200, { files: await listDocs(root) })
      })
    },
  }
}
