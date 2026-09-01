export const HERO = {
  eyebrow: 'ROKMC · AI DATA TF',
  headline: '[김승식승식]',
  sub: '[응애승식.]',
  sub2: '[응애승식.]',
}

export interface ValueCard {
  no: string
  title: string
  desc: string
}

export const VALUES: ValueCard[] = [
  { no: '01', title: '[가치 제목]', desc: '[가치 설명 1~2문장]' },
  { no: '02', title: '[가치 제목]', desc: '[가치 설명 1~2문장]' },
  { no: '03', title: '[가치 제목]', desc: '[가치 설명 1~2문장]' },
]

export interface VoiceCard {
  name: string
  role: string
  quote: string
}

export const VOICES: VoiceCard[] = [
  { name: '[이름]', role: '[AI/LLM 모델링]', quote: '[한마디]' },
  { name: '[이름]', role: '[프론트엔드]', quote: '[한마디]' },
  { name: '[이름]', role: '[백엔드]', quote: '[한마디]' },
  { name: '[이름]', role: '[기획 · PM]', quote: '[한마디]' },
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
  headline: '[마무리 한 줄]',
  sub: '[보조 문장]',
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
  { title: '[영역 제목]', desc: '[영역 설명 1~2문장]' },
  { title: '[영역 제목]', desc: '[영역 설명 1~2문장]' },
  { title: '[영역 제목]', desc: '[영역 설명 1~2문장]' },
]
