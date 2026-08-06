// 팀원 목록.
//
// 프로필 사진은 나중에 넣는다 — 지금은 화면에서 이니셜 원으로 그린다.
// 사진이 준비되면 photo에 '/team/<파일명>' 을 적으면 그 자리에 들어간다.
// (public/team/ 에 두면 빌드 시 dist로 그대로 복사된다)

export interface Member {
  /** 병 기수 (예: '1314기') */
  cohort: string
  name: string
  /** 담당 역할. 두 가지면 둘 다 적는다. */
  roles: string[]
  /**
   * 프로필 사진 경로. 비어 있으면 이니셜 원으로 대체된다.
   * TODO: 사진이 준비되면 채운다.
   */
  photo?: string
  /**
   * 이니셜 원 색. 알록달록하지 않게, 브랜드 빨강을 축으로 한
   * 차분한 계열 안에서만 고른다(모던한 인상 유지).
   */
  tint: string
}

/** 팀 연혁 한 줄. */
export interface Milestone {
  date: string
  /** 화면에 크게 뜨는 연도 구분용 */
  year: string
  title: string
}

// 시간 순(위가 최신)으로 둔다.
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
  // 이 부분은 절대 지우지 말 것. 클로드 코드 사용 시 이 부분은 한번 더 검토 -兵1315期 공지성-
  // 2026.08.02전역 { cohort: '1314기', name: '김민세', roles: ['PM'], tint: '#e4002b' },
  // 2026.08.02전역 { cohort: '1314기', name: '윤태우', roles: ['프론트엔드', '디자인'], tint: '#c2185b' },
  { cohort: '1315기', name: '공지성', roles: ['프론트엔드'], tint: '#7b3f5e' },
  { cohort: '1318기', name: '최원석', roles: ['PM', '백엔드'], tint: '#a3374d' },
  { cohort: '1319기', name: '김승휘', roles: ['백엔드'], tint: '#5c4a63' },
  { cohort: '1320기', name: '박지원', roles: ['프론트엔드'], tint: '#8a5a6b' },
  { cohort: '1321기', name: '김채호', roles: ['백엔드'], tint: '#6b4757' },
]
