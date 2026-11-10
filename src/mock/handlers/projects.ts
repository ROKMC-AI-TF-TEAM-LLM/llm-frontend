import type { CreateProjectRequest, ProjectData, ProjectDocument } from '../../types/project'
import { db, newId, now } from '../db'
import { cursorPage, del, fail, get, offsetPage, ok, patch, post, type MockRoute } from '../server'

const findProject = (projectId: string) => db.projects.find((project) => project.project_id === projectId)

const projectNotFound = () => fail(404, 'PROJECT_NOT_FOUND', '프로젝트를 찾을 수 없습니다.')
const documentNotFound = () => fail(404, 'DOCUMENT_NOT_FOUND', '문서를 찾을 수 없습니다.')

const toListItem = ({ project_id, title, is_favorite }: ProjectData) => ({ project_id, title, is_favorite })

const toStatus = (doc: ProjectDocument) =>
  ({ document_id: doc.document_id, status: doc.status, chunks_indexed: doc.status === 'done' ? 12 : 0, error: doc.status === 'error' ? '문서를 읽지 못했습니다.' : null })

/** 업로드·재시도 후 대기 → 처리 중 → 완료로 넘어가는 과정을 흉내 낸다 */
const startIndexing = (doc: ProjectDocument) => {
  doc.status = 'queued'
  setTimeout(() => { doc.status = 'running' }, 1500)
  setTimeout(() => { doc.status = 'done' }, 4000)
}

export const projectRoutes: MockRoute[] = [
  get('/projects', ({ query }) => {
    const favoriteOnly = query.get('is_favorite') === 'true'
    const projects = db.projects.filter((project) => !favoriteOnly || project.is_favorite)
    return ok(cursorPage(projects.map(toListItem), query))
  }),

  post('/projects', async ({ request }) => {
    const { title, instructions } = await request.json() as CreateProjectRequest
    const project: ProjectData = { project_id: newId(), title, instructions: instructions ?? '', is_favorite: false }
    db.projects.unshift(project)
    return ok(project, 201)
  }),

  get('/projects/:projectId', ({ params }) => {
    const project = findProject(params.projectId)
    return project ? ok(project) : projectNotFound()
  }),

  // 제목·즐겨찾기·지침 변경은 body만 다르다
  ...['/projects/:projectId', '/projects/:projectId/favorite', '/projects/:projectId/instruction'].map((path) =>
    patch(path, async ({ request, params }) => {
      const project = findProject(params.projectId)
      if (!project) return projectNotFound()
      const { instructions, ...rest } = await request.json() as Partial<ProjectData>
      Object.assign(project, rest, instructions === undefined ? {} : { instructions: instructions ?? '' })
      return ok(project)
    })),

  del('/projects/:projectId', ({ params }) => {
    const project = findProject(params.projectId)
    if (!project) return projectNotFound()
    db.projects.splice(db.projects.indexOf(project), 1)
    db.sessions = db.sessions.filter((session) => session.project_id !== params.projectId)
    delete db.projectDocuments[params.projectId]
    return ok(null)
  }),

  get('/projects/:projectId/sessions', ({ params, query }) => {
    const sessions = db.sessions
      .filter((session) => session.project_id === params.projectId)
      .map((session) => ({ ...session, project_id: params.projectId, is_favorite: session.is_favorite ?? false }))
    return ok(cursorPage(sessions, query))
  }),

  get('/projects/:projectId/documents', ({ params, query }) =>
    ok(offsetPage(db.projectDocuments[params.projectId] ?? [], query))),

  post('/projects/:projectId/documents', async ({ request, params }) => {
    if (!findProject(params.projectId)) return projectNotFound()
    const file = (await request.formData()).get('file') as File
    const doc: ProjectDocument = { document_id: newId(), name: file.name, content_type: file.type, size: file.size, status: 'queued', created_at: now() }
    ;(db.projectDocuments[params.projectId] ??= []).push(doc)
    startIndexing(doc)
    return ok(doc, 201)
  }),

  get('/projects/:projectId/documents/:documentId/status', ({ params }) => {
    const doc = db.projectDocuments[params.projectId]?.find((item) => item.document_id === params.documentId)
    return doc ? ok(toStatus(doc)) : documentNotFound()
  }),

  post('/projects/:projectId/documents/:documentId/retry', ({ params }) => {
    const doc = db.projectDocuments[params.projectId]?.find((item) => item.document_id === params.documentId)
    if (!doc) return documentNotFound()
    startIndexing(doc)
    return ok(toStatus(doc))
  }),

  del('/projects/:projectId/documents/:documentId', ({ params }) => {
    const list = db.projectDocuments[params.projectId] ?? []
    const index = list.findIndex((item) => item.document_id === params.documentId)
    if (index < 0) return documentNotFound()
    list.splice(index, 1)
    return ok(null)
  }),
]
