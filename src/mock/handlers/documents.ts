import type { AdminDocumentItem } from '../../types/adminDocument'
import type { DocumentItem } from '../../types/document'
import { db, newId, now } from '../db'
import { del, fail, file, get, offsetPage, ok, post, type MockRoute } from '../server'

const PROCESSING_MS = 3000

const findDocument = (documentId: string) => db.libraryDocuments.find((doc) => doc.document_id === documentId)

const documentNotFound = () => fail(404, 'DOCUMENT_NOT_FOUND', '문서를 찾을 수 없습니다.')

const extensionOf = (name: string) => name.split('.').pop()?.toUpperCase() ?? null

/** 사용자 자료실(`/documents`)은 처리 완료된 문서만, 다른 필드 이름으로 보여준다 */
const toLibraryItem = (doc: AdminDocumentItem): DocumentItem => ({
  name: doc.name,
  type: extensionOf(doc.name),
  domain: doc.domain,
  visibility: doc.visibility,
  owning_department: doc.department,
  applied_at: doc.created_at,
})

const sampleFile = (name: string) =>
  file(name, `${name}\n\nmock 모드에서 내려받은 예시 파일입니다. 실제 파일은 일반 개발 모드에서 확인하세요.\n`)

export const documentRoutes: MockRoute[] = [
  get('/documents', ({ query }) => {
    const domain = query.get('domain')
    const docs = db.libraryDocuments.filter((doc) => doc.status === 'COMPLETED' && (!domain || doc.domain === domain))
    return ok(offsetPage(docs.map(toLibraryItem), query))
  }),

  get('/documents/:name/download', ({ params }) => sampleFile(params.name)),

  // 채팅 답변에 붙은 첨부 파일
  get('/files/:attachmentId', ({ params }) => sampleFile(params.attachmentId)),

  get('/admin/documents', ({ query }) => {
    const domain = query.get('domain')
    const search = query.get('search') ?? ''
    const docs = db.libraryDocuments.filter((doc) => (!domain || doc.domain === domain) && doc.name.includes(search))
    return ok(offsetPage(docs, query))
  }),

  post('/admin/documents', async ({ request }) => {
    const form = await request.formData()
    const upload = form.get('file') as File
    const doc: AdminDocumentItem = {
      document_id: newId(),
      name: String(form.get('name') || upload.name),
      content_type: upload.type,
      domain: String(form.get('domain') || 'GENERAL'),
      visibility: String(form.get('visibility') || 'ALL'),
      department: (form.get('department') as string | null) || null,
      status: 'PROCESSING',
      created_at: now(),
      size: upload.size,
    }
    db.libraryDocuments.unshift(doc)
    setTimeout(() => { doc.status = 'COMPLETED' }, PROCESSING_MS)
    return ok(doc, 201)
  }),

  get('/admin/documents/:documentId/status', ({ params }) => {
    const doc = findDocument(params.documentId)
    if (!doc) return documentNotFound()
    return ok({
      document_id: doc.document_id,
      status: doc.status,
      chunks_indexed: doc.status === 'COMPLETED' ? 24 : 0,
      error: doc.status === 'FAILED' ? '문서를 읽지 못했습니다.' : null,
    })
  }),

  del('/admin/documents/:documentId', ({ params }) => {
    const doc = findDocument(params.documentId)
    if (!doc) return documentNotFound()
    db.libraryDocuments.splice(db.libraryDocuments.indexOf(doc), 1)
    return ok({ document_id: doc.document_id, deleted_chunks: 24 })
  }),
]
