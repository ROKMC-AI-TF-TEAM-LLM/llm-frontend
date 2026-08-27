
export interface Member {
  cohort: string
  name: string
  roles: string[]
  photo?: string
  tint: string
}

export interface Milestone {
  date: string
  year: string
  title: string
}

export const MILESTONES: Milestone[] = [
  {
    year: '2026',
    date: '02.04',
    title: 'AI DATA TF 창설',
  },
  {
    year: '2026',
    date: '03.24',
    title: 'MARS 개발 시작',
  },
  {
    year: '2026',
    date: '06.16',
    title: '2026 인공지능 경진대회 수상',
  },
]

export const MEMBERS: Member[] = [
  // {cohort: '1314기', name: '김민세', roles: [''], tint: '#7b3f5e' },
  // {cohort: '1314기', name: '윤태우', roles: ['프론트엔드'], tint: '#7b3f5e' },
  {cohort: '1315기', name: '공지성', roles: ['프론트엔드'], tint: '#7b3f5e' },
  { cohort: '1318기', name: '최원석', roles: ['PM', '백엔드'], tint: '#a3374d' },
  { cohort: '1319기', name: '김승휘', roles: ['백엔드'], tint: '#5c4a63' },
  { cohort: '1320기', name: '박지원', roles: ['프론트엔드'], tint: '#8a5a6b' },
  { cohort: '1321기', name: '김채호', roles: ['백엔드'], tint: '#6b4757' },
  { cohort: '1331기', name: '김준', roles: ['전우'], tint: '#4a5c3f' },
  { cohort: '1331기', name: '이지성', roles: ['전우'], tint: '#3f5c52' },
]
