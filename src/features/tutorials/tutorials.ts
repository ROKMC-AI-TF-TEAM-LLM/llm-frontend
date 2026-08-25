export interface TutorialPoint {
  title: string
  desc: string
}

export interface Tutorial {
  slug: string
  title: string
  summary: string
  category: string
  product: string
  tint: string
  points: TutorialPoint[]
  pointsTitle: string
  videoUrl?: string
}

export const TUTORIALS: Tutorial[] = [
  {
    slug: 'domains',
    title: '도메인으로 질문 좁히기',
    summary: '분야를 지정하고 물으면 엉뚱한 규정을 끌어오지 않습니다.',
    category: '기본',
    product: 'MARS 채팅',
    tint: '#f7e4d9',
    videoUrl: '/tutorials/domains.mp4',
    pointsTitle: '도메인을 고르는 이유',
    points: [
      {
        title: '같은 말이 분야마다 다른 뜻이다',
        desc: '"검사"는 정비에서는 장비 점검이고 인사에서는 신원 조회입니다. 분야를 정해두면 엉뚱한 규정을 가져오지 않습니다.',
      },
      {
        title: '찾을 범위가 좁아야 정확해진다',
        desc: '전체 문서를 뒤지면 비슷한 표현이 많아 헷갈립니다. 해당 도메인 안에서만 찾으면 근거가 분명해집니다.',
      },
      {
        title: '고르지 않으면 전체에서 찾는다',
        desc: '어느 분야인지 애매할 때는 비워두면 됩니다. 다만 답이 겉돌면 그때 좁혀서 다시 물어보세요.',
      },
      {
        title: '답이 이상하면 도메인부터 확인',
        desc: '질문은 맞는데 답이 어긋난다면 대개 범위가 잘못 잡힌 경우입니다. 분야를 바꿔 다시 물으면 해결됩니다.',
      },
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
    slug: 'translate',
    title: '번역 기능 사용하기',
    summary: '한국어와 영어를 오가며, 문체까지 골라 번역할 수 있습니다.',
    category: '기본',
    product: 'MARS 번역',
    tint: '#dfe9f2',
    videoUrl: '/tutorials/translate.mp4',
    pointsTitle: '번역이 필요한 이유',
    points: [
      {
        title: '방향은 버튼 하나로 전환',
        desc: '한국어→영어, 영어→한국어를 가운데 버튼 하나로 바로 바꿀 수 있습니다.',
      },
      {
        title: '문체를 상황에 맞게 고른다',
        desc: '평시문체와 높임말체 중 골라 번역하면, 보고서나 공문 등 용도에 맞는 어투로 바로 받습니다.',
      },
      {
        title: '결과는 바로 복사해서 쓴다',
        desc: '번역이 끝나면 복사 버튼으로 바로 가져가 문서나 메시지에 붙여 넣을 수 있습니다.',
      },
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
