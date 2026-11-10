// 목록 스크롤·검색·필터·날짜 묶음을 확인하기 위한 대량 가짜 데이터.
// 고정 시드 난수를 쓰므로 새로고침해도 같은 데이터가 만들어진다. 개수는 COUNT에서 조절한다.

import type { AdminDocumentItem } from '../types/adminDocument'
import type { MessageItem } from '../types/chat'
import type { ProjectData, ProjectDocument } from '../types/project'
import type { SessionData } from '../types/session'
import type { UserData, UserStatus } from '../types/user'
import { DOMAINS } from '../utils/document'

const COUNT = {
  users: 80,
  projects: 18,
  sessions: 150,
  libraryDocuments: 120,
  longConversationTurns: 30,
}

const MINUTE = 1
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()

// mulberry32: 작고 빠른 고정 시드 난수
let state = 20261019
const random = () => {
  state = (state + 0x6d2b79f5) | 0
  let t = Math.imul(state ^ (state >>> 15), 1 | state)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1))
const pick = <T>(items: readonly T[]) => items[Math.floor(random() * items.length)]
const chance = (probability: number) => random() < probability
const pad = (n: number) => String(n).padStart(3, '0')

/** 최근일수록 촘촘하게: 오늘·어제·이번 주·이번 달·그 이전이 고루 나오도록 */
const recentMinutes = () => Math.floor(random() ** 2.2 * 90 * DAY)

// ── 어휘 ────────────────────────────────────────────────

const FAMILY_NAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '홍']
const GIVEN_NAMES = ['민준', '서연', '도윤', '하은', '지호', '수아', '현우', '지민', '준서', '예은', '건우', '채원', '우진', '다은', '선우', '유진', '태현', '소율', '재원', '시우']
const DEPARTMENTS = ['인사과', '군수과', '작전과', '정보통신과', '교육훈련과', '재정과', '법무실', '의무실']
// 분야 코드는 프론트 정의(utils/document.ts)를 그대로 쓴다. 분야가 늘면 TOPICS에도 추가할 것.
const DOMAIN_CODES = DOMAINS.map((domain) => domain.code)

const TOPICS: Record<string, string[]> = {
  HR: ['연가 규정', '전입 절차', '포상 추천 기준', '근무 평정', '휴직 신청', '당직 근무 편성', '복지 시설 이용', '진급 심사 일정'],
  TECH: ['보안 점검 절차', '비밀번호 변경 주기', '정보체계 접속 권한', '저장매체 반출', '보안 사고 신고', '전산 장비 교체'],
  FINANCE_LEGAL: ['출장 여비 정산', '예산 집행 기준', '계약 절차', '징계 절차', '법률 자문 요청', '손해배상 처리'],
  GENERAL: ['업무 보고서 작성', '회의록 정리', '공문 초안', '주간 업무 계획', '행사 계획', '결재 절차', '업무 인수인계'],
  MANUAL: ['장비 정비 교범', '차량 운용 교범', '사격 훈련 교범', '응급 처치 교범', '통신 장비 운용'],
  DIRECTIVE: ['복무 훈령', '물자 관리 훈령', '탄약 관리 훈령', '급식 운영 훈령', '병영 생활 훈령'],
}

const QUESTION_FORMS = [
  (topic: string) => `${topic} 관련해서 정리해 줄 수 있어?`,
  (topic: string) => `${topic}은 어떻게 진행하나요?`,
  (topic: string) => `${topic} 기준이 최근에 바뀌었나요?`,
  (topic: string) => `${topic} 예시를 보여주세요.`,
  (topic: string) => `${topic}에서 자주 틀리는 부분이 뭐야?`,
  (topic: string) => `${topic} 담당 부서와 기한을 알려줘.`,
]

const TITLE_FORMS = [
  (topic: string) => topic,
  (topic: string) => `${topic} 문의`,
  (topic: string) => `${topic} 정리`,
  (topic: string) => `${topic} 확인 요청`,
  (topic: string) => `[긴급] ${topic}`,
  (topic: string) => `${topic} 관련 규정 해석과 예외 사항, 담당 부서 확인 (긴 제목 예시)`,
]

const PROJECT_TITLES = [
  '2026 하반기 교육 계획', '부대 정비 지원 TF', '신병 교육 개선', '보안 감사 대응', '연말 행사 준비', '물자 재고 정리',
  '근무 평정 자료 수집', '업무 매뉴얼 개편', '대외 협조 문서', '훈련 결과 분석', '예산 집행 점검', '장비 현대화 검토',
  '규정 개정 검토', '민원 처리 개선', '정보화 사업 관리', '인사 기록 정비', '안전 사고 예방', '홍보 자료 제작',
]

const PROJECT_INSTRUCTIONS = [
  '',
  '보고서 형식(개요·현황·건의)으로 답변하고, 근거 문서의 쪽수를 함께 표기합니다.',
  '표를 적극적으로 사용하고 결론을 먼저 제시합니다.',
  '관련 규정 조항을 인용하고, 확인되지 않은 내용은 추정이라고 밝힙니다.',
  '간결하게 3줄 이내로 요약한 뒤 세부 내용을 덧붙입니다.',
]

const FILE_KINDS = [
  { ext: 'pdf', type: 'application/pdf' },
  { ext: 'hwp', type: 'application/x-hwp' },
  { ext: 'hwpx', type: 'application/hwp+zip' },
  { ext: 'docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { ext: 'xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  { ext: 'pptx', type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
  { ext: 'txt', type: 'text/plain' },
] as const

const DOC_SUFFIXES = ['규정', '지침', '매뉴얼', '계획', '결과 보고', '현황', '절차서', '양식', '개정안', '참고 자료']

// ── 답변 본문 (마크다운 렌더링 확인용으로 형식을 다양하게) ─────────────

const ANSWERS = [
  (topic: string) => `**${topic}**에 대해 정리했습니다.\n\n1. 담당 부서에 신청서를 제출합니다.\n2. 부서장 검토 후 결재를 올립니다.\n3. 결재가 끝나면 결과를 통보받습니다.\n\n> 기한을 넘기면 다음 분기로 넘어가니 주의하세요.`,
  (topic: string) => `## ${topic}\n\n| 구분 | 기준 | 비고 |\n| --- | --- | --- |\n| 일반 | 연 2회 | 상·하반기 |\n| 특별 | 수시 | 부서장 승인 |\n| 예외 | 별도 심의 | 위원회 의결 |\n\n세부 기준은 출처 문서를 확인하세요.`,
  (topic: string) => `${topic} 관련 최근 변경 사항입니다.\n\n- **변경 전:** 서면 제출\n- **변경 후:** 전자 결재 시스템으로 제출\n- **적용일:** 다음 달 1일부터\n\n이전 양식으로 제출한 건은 반려될 수 있습니다.`,
  (topic: string) => `${topic} 예시 양식입니다.\n\n\`\`\`\n제목: ${topic} 보고\n1. 목적\n2. 현황\n3. 문제점 및 개선 방안\n4. 건의 사항\n\`\`\`\n\n항목 순서는 바꾸지 않는 것을 권장합니다.`,
  (topic: string) => `자주 틀리는 부분은 다음과 같습니다.\n\n1. 날짜 형식을 \`YYYY. MM. DD.\`로 쓰지 않는 경우\n2. 붙임 문서 개수를 본문과 다르게 적는 경우\n3. ${topic} 관련 근거 조항을 빠뜨리는 경우\n\n특히 3번은 반려 사유 1위입니다.`,
  (topic: string) => `${topic}에 대한 긴 답변 예시입니다. 문단이 길어질 때 줄바꿈과 여백이 자연스러운지 확인하기 위한 내용입니다.\n\n${'관련 규정은 목적, 적용 범위, 용어 정의, 세부 절차, 예외 사항, 부칙 순서로 구성되어 있으며 각 항목은 상위 규정과의 관계를 고려해 해석해야 합니다. '.repeat(4)}\n\n### 요약\n\n- 원칙적으로 규정을 따릅니다.\n- 예외는 부서장 승인이 필요합니다.\n- 불명확하면 담당 부서에 문의하세요.`,
]

const SOURCE_POOL = ['복무 규정.hwp', '보급 절차.docx', 'UI 미리보기 안내.pdf', '업무 편람 2026.pdf', '전자 결재 사용 지침.hwpx', '물자 관리 규정.pdf']

const sourcesFor = () =>
  chance(0.7)
    ? Array.from({ length: int(1, 3) }, () => ({ name: pick(SOURCE_POOL), page: chance(0.8) ? String(int(1, 120)) : null }))
    : undefined

const conversation = (sessionKey: string, topic: string, domain: string, endMinutesAgo: number, turns: number): MessageItem[] => {
  const items: MessageItem[] = []
  for (let turn = 0; turn < turns; turn++) {
    const at = endMinutesAgo + (turns - turn) * int(2, 15)
    items.push(
      { message_id: `${sessionKey}-q${turn}`, role: 'human', content: pick(QUESTION_FORMS)(topic), domain, created_at: minutesAgo(at + 1) },
      { message_id: `${sessionKey}-a${turn}`, role: 'ai', content: pick(ANSWERS)(topic), sources: sourcesFor(), created_at: minutesAgo(at) },
    )
  }
  return items
}

// ── 생성 ────────────────────────────────────────────────

export const seedUsers = (): UserData[] =>
  Array.from({ length: COUNT.users }, (_, i) => {
    const created = recentMinutes()
    const status: UserStatus = chance(0.2) ? 'pending' : chance(0.1) ? 'rejected' : 'approved'
    return {
      user_id: `seed-user-${pad(i)}`,
      name: pick(FAMILY_NAMES) + pick(GIVEN_NAMES),
      email: `user${pad(i)}@example.com`,
      role: chance(0.08) ? 'admin' : 'user',
      status,
      created_at: minutesAgo(created),
      updated_at: minutesAgo(status === 'pending' ? created : int(0, created)),
    }
  })

export const seedProjects = (): ProjectData[] =>
  PROJECT_TITLES.slice(0, COUNT.projects).map((title, i) => ({
    project_id: `seed-project-${pad(i)}`,
    title,
    instructions: pick(PROJECT_INSTRUCTIONS),
    is_favorite: chance(0.25),
  }))

export const seedProjectDocuments = (projects: ProjectData[]): Record<string, ProjectDocument[]> =>
  Object.fromEntries(projects.map((project, p) => [
    project.project_id,
    Array.from({ length: int(0, 9) }, (_, i): ProjectDocument => {
      const kind = pick(FILE_KINDS)
      return {
        document_id: `seed-project-doc-${pad(p)}-${pad(i)}`,
        name: `${project.title} ${pick(DOC_SUFFIXES)}.${kind.ext}`,
        content_type: kind.type,
        size: int(2, 20_000) * 1024,
        status: chance(0.85) ? 'done' : pick(['error', 'queued', 'running']),
        created_at: minutesAgo(recentMinutes()),
      }
    }),
  ]))

export const seedSessions = (projects: ProjectData[]) => {
  const sessions: SessionData[] = []
  const messages: Record<string, MessageItem[]> = {}

  for (let i = 0; i < COUNT.sessions; i++) {
    const domain = pick(DOMAIN_CODES)
    const topic = pick(TOPICS[domain])
    const updated = recentMinutes()
    const session_id = `seed-session-${pad(i)}`
    sessions.push({
      session_id,
      title: pick(TITLE_FORMS)(topic),
      updated_at: minutesAgo(updated),
      is_favorite: chance(0.12),
      project_id: chance(0.3) ? pick(projects).project_id : null,
    })
    // 일부는 빈 채팅으로 남겨 빈 화면도 확인할 수 있게 한다
    if (chance(0.9)) messages[session_id] = conversation(session_id, topic, domain, updated, int(1, 5))
  }

  // 스크롤·성능 확인용 긴 대화
  const longId = 'seed-session-long'
  sessions.push({ session_id: longId, title: '긴 대화 스크롤 테스트', updated_at: minutesAgo(30), is_favorite: true, project_id: null })
  messages[longId] = conversation(longId, '업무 보고서 작성', 'GENERAL', 30, COUNT.longConversationTurns)

  return { sessions, messages }
}

export const seedLibraryDocuments = (): AdminDocumentItem[] =>
  Array.from({ length: COUNT.libraryDocuments }, (_, i) => {
    const domain = pick(DOMAIN_CODES)
    const kind = pick(FILE_KINDS)
    const deptOnly = chance(0.25)
    return {
      document_id: `seed-doc-${pad(i)}`,
      name: `${pick(TOPICS[domain])} ${pick(DOC_SUFFIXES)}${chance(0.3) ? ` (${2020 + int(0, 6)}년 개정)` : ''}.${kind.ext}`,
      content_type: kind.type,
      domain,
      visibility: deptOnly ? 'DEPT_ONLY' : 'ALL',
      department: deptOnly ? pick(DEPARTMENTS) : null,
      status: chance(0.9) ? 'COMPLETED' : pick(['PROCESSING', 'FAILED']),
      created_at: minutesAgo(recentMinutes()),
      size: int(5, 50_000) * 1024,
    }
  })
