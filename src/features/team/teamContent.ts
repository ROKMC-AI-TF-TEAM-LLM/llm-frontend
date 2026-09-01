export const HERO = {
  eyebrow: 'ROKMC · AI DATA TF',
  headline: 'MARS',
  sub: '해병대 규정·법률 기반 AI',
  sub2: '한 눈에 보기 어려운 해병대 규정 및 법률을 AI로',
  sub3: '데이터 기반 의사결정을 지원하는 해병대 AI 개발 프로젝트입니다.',
}

export interface ValueCard {
  no: string
  title: string
  desc: string
}

export const VALUES: ValueCard[] = [
  { no: '01', title: '지속 협업', desc: '팀원 간 긴밀한 협업으로 결과물을 끊임없이 개선해 나갑니다' },
  { no: '02', title: '신속 반영', desc: '개정된 규정과 법률을 신속히 반영하며, 시스템을 고도화합니다' },
  { no: '03', title: '해병대 기준', desc: '해병대의 조직 문화와 업무 기준을 바탕으로 프로젝트를 진행합니다' },
]

export interface VoiceCard {
  name: string
  role: string
  quote: string
}

export const VOICES: VoiceCard[] = [
  { name: '최원석', role: '[PM]', quote: '1318기' },
  { name: '김승휘', role: '[백엔드]', quote: '1319기' },
  { name: '박지원', role: '[프론트엔드]', quote: '1320기' },
  { name: '김채호', role: '[백엔드]', quote: '1321기' },
  { name: '김 준', role: '[백엔드]', quote: '1331기' },
  { name: '이지성', role: '[AI/LLM 모델링]', quote: '1331기' },
  { name: '', role: '', quote: '1332기' },
  { name: '', role: '', quote: '1332기' },
]

export interface MetricItem {
  value: string
  unit?: string
  label: string
}

export const METRICS: MetricItem[] = [
  { value: '[000]', unit: '', label: '[지표 설명]' },
  { value: '[00]', unit: '%', label: '[지표 설명]' },
  { value: '[0,000]', unit: '건', label: '[지표 설명]' },
  { value: '[00]', unit: '개월', label: '[지표 설명]' },
]

export const CTA = {
  headline: '해병의 질문에, 가장 빠른 답을',
  sub: '지금 MARS를 사용해보세요',
  primaryLabel: '팀 문의하기',
  primaryHref: '#',
  secondaryLabel: '프로젝트 자세히 보기',
  secondaryHref: '#',
}

export interface DomainRow {
  title: string
  desc: string
}

export const DOMAIN_ROWS: DomainRow[] = [
  { title: '정보화·보안', desc: '보안 지침, 정보체계 운영 기준까지 실무에서 자주 놓치는 세부 규정을 정확한 조항 그대로 안내해드립니다. 애매하게 알고 넘어가던 보안 규정도 이제 확실하게 확인하세요.' },
  { title: '근거 검색', desc: '모든 답변에는 근거가 된 조항과 출처가 함께 표시됩니다. 규정이 개정되면 즉시 반영되어, 오래된 정보로 헷갈릴 일이 없습니다.' },
  { title: '통합', desc: '인사·복지, 병영생활, 재무·법무, 정보화·보안, 군수·시설, 인사 명령까지. 부서마다 흩어져 있던 규정집을 하나의 시스템에 모아, 어디서 찾아야 할지 고민할 필요가 없습니다.' },
]
