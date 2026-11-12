// 실제 문서 연결 (선택). 저장소의 mock-docs/<분야 코드>/ 폴더에 넣은 파일을 자료실 문서로 쓴다.
// 파일 목록과 원본은 개발 서버(mock-server/docsServer.ts)가 읽어 준다.
// 폴더가 비었거나 중계가 없으면(정적 빌드 build:mock) 기존 가짜 문서 목록을 그대로 쓴다.

import type { AdminDocumentItem } from '@/features/admin/types'
import { db } from './db'

interface MockDocFile {
  domain: string
  name: string
  size: number
  contentType: string
  modifiedAt: string
}

/** 실제 문서의 document_id → 개발 서버의 파일 위치 */
const fileOf = new Map<string, { domain: string; name: string }>()

/** 실제 문서가 있으면 자료실 문서 목록을 그것으로 바꾼다. 바꿨으면 문서 수를 돌려준다 */
export const loadRealDocuments = async (): Promise<number> => {
  const files = await fetch('/__mock/docs')
    .then((res) => (res.ok ? res.json() : { files: [] }))
    .then((body: { files?: MockDocFile[] }) => body.files ?? [])
    .catch(() => [] as MockDocFile[])
  if (files.length === 0) return 0

  const counts: Record<string, number> = {}
  const documents = files.map((file): AdminDocumentItem => {
    counts[file.domain] = (counts[file.domain] ?? 0) + 1
    const id = `real-${file.domain.toLowerCase()}-${counts[file.domain]}`
    fileOf.set(id, { domain: file.domain, name: file.name })
    return {
      document_id: id,
      name: file.name,
      content_type: file.contentType,
      domain: file.domain,
      visibility: 'ALL',
      department: null,
      status: 'COMPLETED',
      created_at: file.modifiedAt,
      size: file.size,
    }
  })
  db.libraryDocuments.splice(0, db.libraryDocuments.length, ...documents)
  return documents.length
}

/** 실제 문서면 개발 서버에서 원본을 받아 돌려준다. 실제 문서가 아니면 null */
export const realDocumentFile = async (
  documentId: string,
): Promise<Response | null> => {
  const file = fileOf.get(documentId)
  if (!file) return null
  const query = new URLSearchParams(file)
  const res = await fetch(`/__mock/docs/file?${query}`)
  if (!res.ok) return null
  return new Response(await res.blob(), {
    headers: {
      'Content-Type':
        res.headers.get('Content-Type') ?? 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.name)}"`,
    },
  })
}
