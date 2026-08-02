// 프로젝트 기능 목업 데이터.
// 백엔드 엔드포인트가 아직 없어 디자인 비교용으로 프론트 상수를 진실로 둔다.
// TODO(API): GET /projects, GET /projects/:id 가 생기면 이 파일을 react-query 훅으로 교체한다.
//            화면들은 아래 타입에만 의존하므로 교체 시 컴포넌트 수정이 거의 없다.
//
// 이모지는 쓰지 않는다 — 아이콘은 features/projects/icons.tsx 의 선 아이콘으로 통일하고,
// 프로젝트 구분은 이니셜(initial) + 브랜드 톤으로 처리한다.

/** 프로젝트에 올려둔 참고 자료 한 건. */
export interface ProjectFile {
  id: string
  name: string
  /** 확장자 대문자 (PDF, DOCX …) — 배지로 그린다. */
  ext: string
  /** 사람이 읽는 크기 표기. */
  size: string
  /** 목록 보조 설명에 쓰는 분량 표기. */
  lines?: string
}

/** 프로젝트 안에서 나눈 대화 한 건. */
export interface ProjectChat {
  id: string
  title: string
  /** 상대 시간 표기 ("2시간 전"). 목업이라 계산하지 않고 고정 문자열로 둔다. */
  updatedAt: string
  messageCount: number
  /** 대화 즐겨찾기. 사이드바 '즐겨찾기' 칸에도 함께 올라간다. */
  isFavorite?: boolean
}

export interface Project {
  id: string
  name: string
  /** 한 줄 소개. 카드/헤더에 노출된다. */
  description: string
  /** 고정해둔 역할·지시사항 (시스템 프롬프트). */
  instructions: string
  /** 썸네일 대신 쓰는 한 글자. 이모지 대신 이니셜을 쓴다. */
  initial: string
  files: ProjectFile[]
  chats: ProjectChat[]
  updatedAt: string
  /** 정렬용 — 최근 업데이트 순. 작을수록 최신. */
  order: number
  isFavorite: boolean
  /** 소속/용도 라벨. */
  domain: string
}

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p-inspection',
    name: '함정 정비 검사 지원',
    description: '정비 주기·검사 항목 규정을 학습해 검사 준비 문서를 만들어주는 전담 AI.',
    instructions:
      '너는 함정 정비 검사를 담당하는 실무자를 돕는 조력자다.\n\n' +
      '- 항상 근거 규정의 조·항·호를 함께 밝힌다.\n' +
      '- 규정에 없는 내용은 추측하지 말고 "규정에 명시되지 않음"이라고 답한다.\n' +
      '- 답변은 실무자가 그대로 보고서에 붙일 수 있도록 개조식으로 정리한다.\n' +
      '- 정비 주기는 반드시 표로 정리한다.',
    initial: '정',
    domain: '정비',
    updatedAt: '2시간 전',
    order: 1,
    isFavorite: true,
    files: [
      { id: 'f1', name: '함정정비규정_2026.pdf', ext: 'PDF', size: '4.2MB', lines: '312쪽' },
      { id: 'f2', name: '검사항목_체크리스트.xlsx', ext: 'XLSX', size: '128KB', lines: '84행' },
      { id: 'f3', name: '정비주기_기준표.docx', ext: 'DOCX', size: '96KB', lines: '22쪽' },
    ],
    chats: [
      { id: 'c1', title: '3분기 정기검사 준비 항목 정리', updatedAt: '2시간 전', messageCount: 14 },
      { id: 'c2', title: '추진기 계통 정비 주기 확인', updatedAt: '어제', messageCount: 8 },
      { id: 'c3', title: '검사 지적사항 보고서 초안', updatedAt: '3일 전', messageCount: 22 },
    ],
  },
  {
    id: 'p-hr',
    name: '인사 규정 상담',
    description: '휴가·전출입·평가 규정을 근거와 함께 안내하는 인사 담당자용 AI.',
    instructions:
      '너는 인사 규정 상담원이다.\n\n' +
      '- 질문자가 규정 용어를 몰라도 이해할 수 있게 쉬운 말로 먼저 설명하고, 그 다음 원문을 인용한다.\n' +
      '- 개인의 구체적 사정이 필요한 판단은 단정하지 말고 인사담당 문의를 안내한다.\n' +
      '- 날짜 계산이 필요한 경우 계산 과정을 보여준다.',
    initial: '인',
    domain: '인사',
    updatedAt: '어제',
    order: 2,
    isFavorite: true,
    files: [
      { id: 'f1', name: '인사관리규정.pdf', ext: 'PDF', size: '2.8MB', lines: '196쪽' },
      { id: 'f2', name: '휴가업무_처리지침.pdf', ext: 'PDF', size: '1.1MB', lines: '48쪽' },
    ],
    chats: [
      { id: 'c1', title: '연가 이월 가능 일수 기준', updatedAt: '어제', messageCount: 6 },
      { id: 'c2', title: '전출 시 관사 반납 절차', updatedAt: '5일 전', messageCount: 11 },
    ],
  },
  {
    id: 'p-report',
    name: '보고서 문체 교정',
    description: '초안을 우리 부대 보고서 문체와 서식에 맞게 다듬어주는 AI.',
    instructions:
      '너는 보고서 교정 담당이다.\n\n' +
      '- 개조식, 명사형 종결("~함", "~임")을 원칙으로 한다.\n' +
      '- 수동태와 군더더기 수식어를 덜어낸다.\n' +
      '- 원문의 사실관계는 절대 바꾸지 않는다. 애매하면 질문한다.\n' +
      '- 교정 후에는 무엇을 왜 바꿨는지 짧게 덧붙인다.',
    initial: '보',
    domain: '행정',
    updatedAt: '3일 전',
    order: 3,
    isFavorite: false,
    files: [
      { id: 'f1', name: '보고서_작성요령.docx', ext: 'DOCX', size: '84KB', lines: '18쪽' },
      { id: 'f2', name: '문서서식_표준.pdf', ext: 'PDF', size: '640KB', lines: '32쪽' },
      { id: 'f3', name: '지난_우수보고서_모음.pdf', ext: 'PDF', size: '3.4MB', lines: '120쪽' },
      { id: 'f4', name: '금지표현_목록.txt', ext: 'TXT', size: '12KB', lines: '210행' },
    ],
    chats: [
      { id: 'c1', title: '분기 실적 보고서 문체 정리', updatedAt: '3일 전', messageCount: 18 },
      { id: 'c2', title: '회의 결과 요약 개조식 변환', updatedAt: '1주 전', messageCount: 9 },
      { id: 'c3', title: '지시사항 하달문 초안 검토', updatedAt: '2주 전', messageCount: 5 },
      { id: 'c4', title: '용어 통일 기준 정리', updatedAt: '2주 전', messageCount: 12 },
    ],
  },
  {
    id: 'p-supply',
    name: '보급 청구 도우미',
    description: '품목 코드와 청구 절차를 찾아주고 청구서 초안까지 잡아주는 AI.',
    instructions:
      '너는 보급 업무 조력자다.\n\n' +
      '- 품목을 물어보면 코드, 단위, 청구 계통을 표로 정리한다.\n' +
      '- 재고·소요 판단은 규정 기준만 제시하고 수량은 단정하지 않는다.\n' +
      '- 긴급 청구 절차와 정상 절차를 구분해서 안내한다.',
    initial: '보',
    domain: '보급',
    updatedAt: '1주 전',
    order: 4,
    isFavorite: false,
    files: [
      { id: 'f1', name: '보급업무규정.pdf', ext: 'PDF', size: '5.6MB', lines: '408쪽' },
      { id: 'f2', name: '품목코드_대장.xlsx', ext: 'XLSX', size: '2.2MB', lines: '3,140행' },
    ],
    chats: [
      { id: 'c1', title: '소모성 공구류 청구 계통', updatedAt: '1주 전', messageCount: 7 },
      { id: 'c2', title: '긴급 청구 승인 권한 확인', updatedAt: '3주 전', messageCount: 4 },
    ],
  },
  {
    id: 'p-edu',
    name: '교육 훈련 계획',
    description: '훈련 과목 편성과 평가 기준을 규정에 맞춰 설계해주는 AI.',
    instructions:
      '너는 교육훈련 계획 담당이다.\n\n' +
      '- 훈련 계획은 목표 → 과목 → 시간 배분 → 평가 방법 순으로 구성한다.\n' +
      '- 연간 의무 이수 시간을 반드시 확인해 충족 여부를 알려준다.\n' +
      '- 안전 통제 사항을 빠뜨리지 않는다.',
    initial: '교',
    domain: '교육',
    updatedAt: '2주 전',
    order: 5,
    isFavorite: false,
    files: [{ id: 'f1', name: '교육훈련규정.pdf', ext: 'PDF', size: '3.1MB', lines: '224쪽' }],
    chats: [{ id: 'c1', title: '하반기 정신교육 편성안', updatedAt: '2주 전', messageCount: 10 }],
  },
]

export const findProject = (id: string | undefined): Project | undefined =>
  MOCK_PROJECTS.find((p) => p.id === id)

/** 정렬 기준. 목록 상단 드롭다운에서 고른다. */
export type SortKey = 'updated' | 'name' | 'chats'

export const SORT_LABELS: Record<SortKey, string> = {
  updated: '마지막 업데이트',
  name: '이름',
  chats: '대화 수',
}

export const sortProjects = (list: Project[], key: SortKey): Project[] =>
  [...list].sort((a, b) => {
    if (key === 'name') return a.name.localeCompare(b.name, 'ko')
    if (key === 'chats') return b.chats.length - a.chats.length
    return a.order - b.order
  })

/** 프로젝트 안에서 나눈 대화를 최근 항목처럼 평탄화한 목록. */
export const projectRecentChats = MOCK_PROJECTS.flatMap((p) =>
  p.chats.map((c) => ({ ...c, projectId: p.id, projectName: p.name })),
)
