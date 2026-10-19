// mock 서버의 메모리 저장소. 새로고침하면 아래 초기 데이터로 돌아간다.
// 직접 적은 예시 데이터 뒤에 seed.ts가 만든 대량 데이터를 붙인다.

import type { AdminDocumentItem } from '../types/adminDocument'
import type { MessageItem } from '../types/chat'
import type { ProjectData, ProjectDocument } from '../types/project'
import type { SessionData } from '../types/session'
import type { UserData } from '../types/user'
import { minutesAgo, seedLibraryDocuments, seedProjectDocuments, seedProjects, seedSessions, seedUsers } from './seed'

export const now = () => new Date().toISOString()
export const newId = () => crypto.randomUUID()

/** 로그인하면 항상 이 계정이 된다 (관리자 화면까지 보이도록 admin) */
export const ME_ID = 'mock-admin'

const users: UserData[] = [
  { user_id: ME_ID, name: '미리보기 관리자', email: 'mock@example.com', role: 'admin', status: 'approved', created_at: minutesAgo(60 * 24 * 30), updated_at: minutesAgo(60 * 24 * 30) },
  { user_id: 'mock-user-1', name: '김일반', email: 'user1@example.com', role: 'user', status: 'approved', created_at: minutesAgo(60 * 24 * 7), updated_at: minutesAgo(60 * 24 * 7) },
  { user_id: 'mock-user-2', name: '이대기', email: 'pending1@example.com', role: 'user', status: 'pending', created_at: minutesAgo(60 * 3), updated_at: minutesAgo(60 * 3) },
  { user_id: 'mock-user-3', name: '박대기', email: 'pending2@example.com', role: 'user', status: 'pending', created_at: minutesAgo(30), updated_at: minutesAgo(30) },
  { user_id: 'mock-user-4', name: '최거절', email: 'rejected@example.com', role: 'user', status: 'rejected', created_at: minutesAgo(60 * 24 * 2), updated_at: minutesAgo(60 * 24) },
]

const projects: ProjectData[] = [
  { project_id: 'mock-project-1', title: 'UI 미리보기 프로젝트', instructions: '업무 자료를 정리하고 보고서 형식으로 답변합니다.', is_favorite: true },
  { project_id: 'mock-project-2', title: '교육 계획 수립', instructions: '', is_favorite: false },
]

const sessions: SessionData[] = [
  { session_id: 'mock-session-1', title: 'Mock 채팅 미리보기', updated_at: minutesAgo(5), is_favorite: true, project_id: null },
  { session_id: 'mock-session-2', title: '휴가 규정 문의', updated_at: minutesAgo(60 * 5), is_favorite: false, project_id: null },
  { session_id: 'mock-session-3', title: '프로젝트 자료 요약', updated_at: minutesAgo(60 * 26), is_favorite: false, project_id: 'mock-project-1' },
]

const messages: Record<string, MessageItem[]> = {
  'mock-session-1': [
    { message_id: 'mock-message-1', role: 'human', content: '어떤 화면을 확인할 수 있나요?', created_at: minutesAgo(6), domain: 'GENERAL' },
    {
      message_id: 'mock-message-2',
      role: 'ai',
      content: '백엔드 없이 **채팅, 프로젝트, 번역, 자료실, 관리자 화면**을 확인할 수 있습니다.\n\n새 질문을 입력하면 예시 답변이 스트리밍됩니다.',
      created_at: minutesAgo(5),
      sources: [{ name: 'UI 미리보기 안내.pdf', page: '1' }],
    },
  ],
  'mock-session-2': [
    { message_id: 'mock-message-3', role: 'human', content: '연가는 며칠까지 쓸 수 있나요?', created_at: minutesAgo(60 * 5 + 1), domain: 'HR' },
    { message_id: 'mock-message-4', role: 'ai', content: '예시 답변입니다. 실제 규정은 일반 개발 모드에서 확인하세요.', created_at: minutesAgo(60 * 5) },
  ],
}

const projectDocuments: Record<string, ProjectDocument[]> = {
  'mock-project-1': [
    { document_id: 'mock-project-doc-1', name: '업무 현황.xlsx', content_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 48_200, status: 'done', created_at: minutesAgo(60 * 24) },
    { document_id: 'mock-project-doc-2', name: '읽기 실패 예시.hwp', content_type: 'application/x-hwp', size: 120_400, status: 'error', created_at: minutesAgo(60 * 20) },
  ],
}

const libraryDocuments: AdminDocumentItem[] = [
  { document_id: 'mock-doc-1', name: 'UI 미리보기 안내.pdf', content_type: 'application/pdf', domain: 'GENERAL', visibility: 'ALL', department: null, status: 'COMPLETED', created_at: minutesAgo(60 * 24 * 10), size: 1_024_000 },
  { document_id: 'mock-doc-2', name: '복무 규정.hwp', content_type: 'application/x-hwp', domain: 'HR', visibility: 'ALL', department: null, status: 'COMPLETED', created_at: minutesAgo(60 * 24 * 5), size: 356_000 },
  { document_id: 'mock-doc-3', name: '보급 절차.docx', content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', domain: 'DIRECTIVE', visibility: 'DEPT_ONLY', department: '군수과', status: 'COMPLETED', created_at: minutesAgo(60 * 24), size: 88_000 },
  { document_id: 'mock-doc-4', name: '처리 실패 예시.pdf', content_type: 'application/pdf', domain: 'GENERAL', visibility: 'ALL', department: null, status: 'FAILED', created_at: minutesAgo(60 * 2), size: 2_048 },
]

const latestFirst = (a: { created_at: string }, b: { created_at: string }) => b.created_at.localeCompare(a.created_at)

const generatedProjects = seedProjects()
const generatedSessions = seedSessions(generatedProjects)

export const db = {
  users: [...users, ...seedUsers().sort(latestFirst)],
  projects: [...projects, ...generatedProjects],
  sessions: [...sessions, ...generatedSessions.sessions],
  messages: { ...messages, ...generatedSessions.messages },
  projectDocuments: { ...projectDocuments, ...seedProjectDocuments(generatedProjects) },
  libraryDocuments: [...libraryDocuments, ...seedLibraryDocuments().sort(latestFirst)],
}
