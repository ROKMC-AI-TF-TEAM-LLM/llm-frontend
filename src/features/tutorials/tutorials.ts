// 튜토리얼(소개 영상) 목록.
//
// ── 영상 파일 두는 곳 ─────────────────────────────────────────────
// public/tutorials/<slug>.mp4 에 넣고 videoUrl에 '/tutorials/<slug>.mp4' 를 적는다.
// (예: public/tutorials/projects.mp4  →  videoUrl: '/tutorials/projects.mp4')
//
// public/ 안의 파일은 빌드하면 dist/ 로 그대로 복사되고, 주소도 그대로 유지된다.
// 외부 주소(YouTube 등)를 쓰지 않으므로 인터넷이 없는 내부망에서도 재생된다.
// videoUrl이 없는 항목은 '영상 준비 중' 자리표시가 나온다.
// ──────────────────────────────────────────────────────────────
//
// TODO(API): 튜토리얼을 서버에서 관리하게 되면 이 상수를 조회 훅으로 교체한다.

/**
 * '이 기능이 왜 있는지'를 설명하는 한 항목.
 * 영상이 '쓰는 법'을 보여주므로, 페이지 본문은 겹치지 않게 '있는 이유'를 다룬다.
 */
export interface TutorialPoint {
  title: string
  desc: string
}

export interface Tutorial {
  /** URL에 쓰는 식별자 (/tutorials/projects) */
  slug: string
  title: string
  /** 제목 아래 한두 줄 소개 */
  summary: string
  category: string
  product: string
  /**
   * 카드 썸네일 바탕색.
   * 클로드 튜토리얼 카드처럼 위쪽에 색면을 깔아 목록이 심심하지 않게 한다.
   * 브랜드 빨강 계열 안에서 농도만 달리해 톤이 흐트러지지 않게 골랐다.
   */
  tint: string
  /** 본문에 쓰는 '이 기능이 있는 이유'. 영상의 사용법 설명과 겹치지 않게 쓴다. */
  points: TutorialPoint[]
  /** 본문 섹션 제목 (예: '프로젝트가 있는 이유'). */
  pointsTitle: string
  /**
   * 영상 주소. 비어 있으면 '영상 준비 중'으로 표시된다.
   * 폐쇄망 운용이라 외부 임베드(YouTube 등) 대신 public/ 에 둔 파일을 직접 재생한다.
   */
  videoUrl?: string
}

export const TUTORIALS: Tutorial[] = [
  {
    slug: 'ask-well',
    title: '질문 잘하는 법',
    summary: '같은 내용도 어떻게 묻느냐에 따라 찾아오는 근거가 달라집니다.',
    category: '기본',
    product: 'MARS 채팅',
    tint: '#f7e4d9',
    pointsTitle: '질문이 답을 바꾸는 이유',
    points: [
      { title: '구체적으로 묻기', desc: '"휴가"보다 "정기휴가 신청 절차"처럼 좁혀서 물을수록 정확한 조항을 찾습니다.' },
      { title: '도메인 좁히기', desc: '분야를 지정하면 그 도메인 문서 안에서만 검색해 답합니다.' },
      { title: '근거 확인하기', desc: '출처를 펼쳐 실제 조항 원문을 함께 확인하는 습관이 중요합니다.' },
    ],
  },
  {
    slug: 'sources',
    title: '근거와 출처 읽는 법',
    summary: '답변에 붙은 출처를 읽고, 믿을 만한지 판단하는 기준을 잡습니다.',
    category: '실무',
    product: 'MARS 채팅',
    tint: '#dfe7e4',
    pointsTitle: '근거를 보여주는 이유',
    points: [
      { title: '출처 배지 이해하기', desc: '답변 아래 붙는 문서명과 쪽수가 무엇을 가리키는지 살펴봅니다.' },
      { title: '참고자료 구분', desc: '규정과 직접 관련이 없는 자료는 참고용으로 따로 표시됩니다.' },
      { title: '근거가 없을 때', desc: '충분한 근거를 못 찾으면 추측하지 않고 담당 부서 문의를 안내합니다.' },
    ],
  },
  {
    slug: 'documents',
    title: '문서 검색 활용하기',
    summary: '답변을 기다리지 않고 규정 원문을 직접 열어보는 방법입니다.',
    category: '기본',
    product: 'MARS 문서',
    tint: '#e9e2ef',
    pointsTitle: '문서를 직접 여는 이유',
    points: [
      { title: '카테고리로 훑기', desc: '도메인 탭으로 원하는 분야의 문서만 모아 봅니다.' },
      { title: '검색으로 좁히기', desc: '문서명·부서·종류로 원하는 문서를 빠르게 찾습니다.' },
      { title: '원문 열어보기', desc: '문서를 눌러 실제 조항을 그대로 확인합니다.' },
    ],
  },
  {
    slug: 'projects',
    title: '프로젝트 시작하기',
    summary:
      '자주 하는 업무는 지침과 자료를 미리 걸어두면 매번 배경을 설명하지 않아도 됩니다.',
    category: '실무',
    product: 'MARS 프로젝트',
    tint: '#fbdbe2',
    videoUrl: '/tutorials/projects.mp4',
    pointsTitle: '프로젝트가 있는 이유',
    points: [
      {
        title: '같은 설명을 반복하지 않게',
        desc: '"나는 정비 검사 담당이고, 답변은 개조식으로, 근거 조항을 꼭 붙여줘." 이 말을 대화마다 다시 적고 있다면 그 설명을 한곳에 걸어둘 수 있습니다.',
      },
      {
        title: '업무마다 다른 기준을 따로 지킨다',
        desc: '정비 검사와 인사 상담은 참고할 규정도, 답변 형식도 다릅니다. 프로젝트를 나눠두면 서로 섞이지 않습니다.',
      },
      {
        title: '자료를 매번 다시 올리지 않게',
        desc: '자주 쓰는 규정·서식은 한 번 올려두면 그 프로젝트의 모든 대화가 같은 자료를 참고합니다.',
      },
      {
        title: '대화가 업무별로 쌓인다',
        desc: '흩어진 대화 목록을 뒤지지 않고, 그 업무 안에서 지난 논의를 바로 찾을 수 있습니다.',
      },
    ],
  },
]

export const findTutorial = (slug: string | undefined): Tutorial | undefined =>
  TUTORIALS.find((t) => t.slug === slug)
