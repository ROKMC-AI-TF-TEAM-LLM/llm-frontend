// 튜토리얼(소개 영상) 목록.
//
// 영상은 아직 제작 중이라 videoUrl을 비워둔다. 영상이 나오면 그 항목의 videoUrl만
// 채우면 화면(TutorialPage)이 알아서 자리에 끼워 넣는다 — 화면 코드는 손댈 필요 없다.
//
// TODO(API): 튜토리얼을 서버에서 관리하게 되면 이 상수를 조회 훅으로 교체한다.

export interface TutorialChapter {
  title: string
  desc: string
}

export interface Tutorial {
  /** URL에 쓰는 식별자 (/tutorials/projects) */
  slug: string
  title: string
  /** 제목 아래 한두 줄 소개 */
  summary: string
  /** 오른쪽 메타 — 분류 / 대상 / 시청 시간 */
  category: string
  product: string
  watchTime: string
  /** 영상에서 다루는 순서. 영상이 없어도 이 목록만으로 내용을 알 수 있게 쓴다. */
  chapters: TutorialChapter[]
  /** 임베드 주소. 비어 있으면 '영상 준비 중'으로 표시된다. */
  videoUrl?: string
}

export const TUTORIALS: Tutorial[] = [
  {
    slug: 'projects',
    title: '프로젝트 시작하기',
    summary:
      '지침과 파일을 한 번 고정해두고, 매번 배경을 다시 설명하지 않는 방법을 알아봅니다.',
    category: '실무',
    product: 'MARS 프로젝트',
    watchTime: '7분',
    chapters: [
      {
        title: '프로젝트란 무엇인가',
        desc: '역할·지침·참고 파일을 고정해두는 공간입니다. 그 안의 모든 대화에 같은 맥락이 자동으로 적용됩니다.',
      },
      {
        title: '프로젝트 만들기',
        desc: '사이드바 프로젝트 섹션에서 새 프로젝트를 만들고, 이름과 지침을 함께 입력합니다.',
      },
      {
        title: '지침 작성하기',
        desc: '답변 형식, 인용 규칙, 쓰지 말아야 할 표현을 적어두면 매 대화마다 다시 설명할 필요가 없습니다.',
      },
      {
        title: '참고 파일 올리기',
        desc: '규정·지침·서식을 올려두면 답변을 만들 때 항상 함께 참고합니다.',
      },
      {
        title: '프로젝트 안에서 대화하기',
        desc: '프로젝트에서 시작한 대화는 그 안에 쌓이고, 사이드바 최근 대화에도 함께 표시됩니다.',
      },
      {
        title: '정리하고 관리하기',
        desc: '자주 쓰는 프로젝트는 즐겨찾기로 올리고, 이름 변경·삭제로 목록을 정돈합니다.',
      },
    ],
  },
  {
    slug: 'ask-well',
    title: '질문 잘하는 법',
    summary: '같은 내용이라도 어떻게 묻느냐에 따라 근거를 찾는 정확도가 달라집니다.',
    category: '기본',
    product: 'MARS 채팅',
    watchTime: '5분',
    chapters: [
      { title: '구체적으로 묻기', desc: '"휴가"보다 "정기휴가 신청 절차"처럼 좁혀서 물을수록 정확한 조항을 찾습니다.' },
      { title: '도메인 좁히기', desc: '분야를 지정하면 그 도메인 문서 안에서만 검색해 답합니다.' },
      { title: '근거 확인하기', desc: '출처를 펼쳐 실제 조항 원문을 함께 확인하는 습관이 중요합니다.' },
    ],
  },
  {
    slug: 'documents',
    title: '문서 검색 활용하기',
    summary: '대화 없이도 규정 문서를 카테고리와 검색어로 직접 열람할 수 있습니다.',
    category: '기본',
    product: 'MARS 문서',
    watchTime: '4분',
    chapters: [
      { title: '카테고리로 훑기', desc: '도메인 탭으로 원하는 분야의 문서만 모아 봅니다.' },
      { title: '검색으로 좁히기', desc: '문서명·부서·종류로 원하는 문서를 빠르게 찾습니다.' },
      { title: '원문 열어보기', desc: '문서를 눌러 실제 조항을 그대로 확인합니다.' },
    ],
  },
  {
    slug: 'sources',
    title: '근거와 출처 읽는 법',
    summary: 'MARS가 답변에 붙이는 출처를 어떻게 읽고 검증하는지 설명합니다.',
    category: '실무',
    product: 'MARS 채팅',
    watchTime: '6분',
    chapters: [
      { title: '출처 배지 이해하기', desc: '답변 아래 붙는 문서명과 쪽수가 무엇을 가리키는지 살펴봅니다.' },
      { title: '참고자료 구분', desc: '규정과 직접 관련이 없는 자료는 참고용으로 따로 표시됩니다.' },
      { title: '근거가 없을 때', desc: '충분한 근거를 못 찾으면 추측하지 않고 담당 부서 문의를 안내합니다.' },
    ],
  },
]

export const findTutorial = (slug: string | undefined): Tutorial | undefined =>
  TUTORIALS.find((t) => t.slug === slug)
