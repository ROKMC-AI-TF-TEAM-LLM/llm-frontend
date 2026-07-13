// RAG 문서 목업 데이터.
// 실제 문서 API가 아직 없어 이 목업이 "서버 응답" 자리를 대신한다.
// TODO(API): 실제 조회로 교체 시 이 파일을 fetch로 바꾸고, 응답을 RagDoc 형태로 매핑만 맞추면 된다.
//            (백엔드 도메인 필드명이 domain / category 중 무엇인지 확인 후 매핑 지점 한 곳만 수정)

// 도메인은 서버가 내려주는 값을 그대로 쓴다.
// 프론트에 도메인 목록을 하드코딩하지 않는다 — 언제든 추가·변경될 수 있으므로.
// 서버는 코드(HR)와 한글 라벨(인사·복지)을 함께 내려준다. 화면엔 라벨을, 필터엔 코드를 쓴다.
export type RagCategory = string

export interface RagDoc {
  id: string
  category: RagCategory     // 도메인 코드 (예: HR) — 필터 기준
  categoryLabel: string     // 도메인 한글 라벨 (예: 인사·복지) — 화면 표시용
  name: string        // 파일명
  badge: string       // 문서 종류 라벨 (예: 시행규칙, 지침, 편람)
  description: string // 리스트에 보이는 한 줄 설명
  pages: number       // 페이지 수
  size: string        // 용량 라벨
  date: string        // 등록일 라벨
  summary: string     // 상세 화면의 문서 요약
}

// 탭에 쓰는 도메인 한 개 (코드 + 표시용 라벨)
export interface Domain {
  code: string
  label: string
}

export interface CategoryStyle {
  bar: string       // 리스트 좌측 보더 색
  badgeBg: string   // 아이콘/뱃지 배경
  badgeText: string // 뱃지 텍스트 색
}

// 도메인 값을 미리 모르므로 색을 고정 매핑할 수 없다.
// → 팔레트를 두고 도메인 문자열을 해시해 '항상 같은 색'이 나오도록 결정적으로 배정한다.
//   도메인이 몇 개든, 이름이 무엇이든 대응한다. 새 도메인이 추가돼도 코드 수정 불필요.
const CATEGORY_PALETTE: CategoryStyle[] = [
  { bar: '#e4002b', badgeBg: '#fdeef1', badgeText: '#c0002a' }, // red (brand)
  { bar: '#3b6fe0', badgeBg: '#eaf0fd', badgeText: '#2a54b8' }, // blue
  { bar: '#e0952b', badgeBg: '#fbf1e2', badgeText: '#b3720f' }, // amber
  { bar: '#10b981', badgeBg: '#e6f7f1', badgeText: '#0a7d5a' }, // green
  { bar: '#8b5cf6', badgeBg: '#f1ecfe', badgeText: '#6b3fd4' }, // violet
  { bar: '#0ea5e9', badgeBg: '#e5f5fd', badgeText: '#0b7fb4' }, // sky
  { bar: '#ec4899', badgeBg: '#fdecf4', badgeText: '#c02a76' }, // pink
  { bar: '#64748b', badgeBg: '#eef1f5', badgeText: '#475569' }, // slate
]

// 문자열 → 안정적인 정수 해시 (같은 도메인은 언제나 같은 색)
const hashString = (s: string): number => {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0 // 32bit 정수 유지
  }
  return Math.abs(h)
}

export const getCategoryStyle = (category: string): CategoryStyle =>
  CATEGORY_PALETTE[hashString(category) % CATEGORY_PALETTE.length]

// 문서 목록에 실제로 존재하는 도메인만 추출(코드 기준 중복 제거) → 탭을 데이터에서 파생한다.
// TODO(API): 백엔드에 도메인 목록 API가 따로 생기면 이 파생 대신 그 응답을 쓰면 된다.
export const extractDomains = (docs: RagDoc[]): Domain[] => {
  const map = new Map<string, string>() // code -> label
  for (const d of docs) {
    if (d.category && !map.has(d.category)) map.set(d.category, d.categoryLabel || d.category)
  }
  return [...map].map(([code, label]) => ({ code, label }))
}

// ─────────────────────────────────────────────────────────────
// 목업 데이터 (서버 응답 대역). 서버가 코드+라벨을 함께 준다는 전제.
export const MOCK_RAG_DOCS: RagDoc[] = [
  {
    id: 'd1', category: 'HR', categoryLabel: '인사·복지', name: '군인사법 시행규칙.pdf', badge: '시행규칙',
    description: '진급, 보직, 전출입 등 인사 행정 전반의 시행 절차를 규정합니다.',
    pages: 42, size: '1.2MB', date: '2026.6.20',
    summary: '군인사법의 위임에 따라 진급·보직·전출입 등 인사 행정의 세부 시행 절차를 정한 규칙입니다. 각 절차별 제출 서류와 심사 기준, 심사위원회 운영 절차를 안내합니다.',
  },
  {
    id: 'd2', category: 'HR', categoryLabel: '인사·복지', name: '진급심사 운영지침.pdf', badge: '지침',
    description: '진급 선발 심사의 기준, 배점, 운영 절차를 정리한 지침입니다.',
    pages: 18, size: '640KB', date: '2026.6.5',
    summary: '진급 선발 심사의 평가 항목별 배점과 심사위원 구성, 이의 신청 절차를 규정합니다.',
  },
  {
    id: 'd3', category: 'HR', categoryLabel: '인사·복지', name: '전출입 관리 규정.pdf', badge: '규정',
    description: '부대 간 전출입 신청, 승인, 후속 조치 절차를 규정합니다.',
    pages: 24, size: '880KB', date: '2026.5.30',
    summary: '전출입 신청 요건과 승인 권한, 인수인계 및 후속 행정 처리 절차를 정합니다.',
  },
  {
    id: 'd4', category: 'HR', categoryLabel: '인사·복지', name: '병적관리 업무편람.pdf', badge: '편람',
    description: '병적 등록, 변동사항 관리, 전산 처리 기준을 정리한 실무 편람입니다.',
    pages: 56, size: '2.1MB', date: '2026.5.12',
    summary: '병적 기록의 등록·정정·말소 기준과 전산 시스템 입력 방법을 실무 중심으로 설명합니다.',
  },
  {
    id: 'd5', category: 'DIRECTIVE', categoryLabel: '훈령', name: '군인의 지위 및 복무에 관한 기본법.pdf', badge: '법률',
    description: '군인의 기본적 지위와 복무에 관한 원칙을 규정한 상위 법률입니다.',
    pages: 38, size: '1.0MB', date: '2026.6.23',
    summary: '군인의 권리와 의무, 복무 기본 원칙, 기본권 보장에 관한 사항을 규정한 기본법입니다.',
  },
  {
    id: 'd6', category: 'DIRECTIVE', categoryLabel: '훈령', name: '병 복무규정 시행세칙.pdf', badge: '세칙',
    description: '병 계급의 일상 복무, 생활 통제, 준수사항을 세부적으로 규정합니다.',
    pages: 30, size: '900KB', date: '2026.6.10',
    summary: '병 계급의 일과, 생활관 운영, 외출·외박 준수사항 등 일상 복무의 세부 기준입니다.',
  },
  {
    id: 'd7', category: 'DIRECTIVE', categoryLabel: '훈령', name: '근무기강 확립 지침.pdf', badge: '지침',
    description: '복무 기강 저해 행위 예방과 지도 감독 절차를 안내합니다.',
    pages: 14, size: '410KB', date: '2026.5.28',
    summary: '기강 저해 행위의 유형과 예방 활동, 지휘관의 지도·감독 책임을 규정합니다.',
  },
  {
    id: 'd8', category: 'MANUAL', categoryLabel: '교범', name: '당직근무 운영규칙.pdf', badge: '규칙',
    description: '당직 편성, 근무 수칙, 인수인계 절차를 규정합니다.',
    pages: 20, size: '560KB', date: '2026.5.2',
    summary: '당직 편성 기준과 근무 중 준수사항, 상황 보고 및 인수인계 절차를 정합니다.',
  },
  {
    id: 'd9', category: 'GENERAL', categoryLabel: '일반', name: '군인 휴가 규정 시행령.pdf', badge: '시행령',
    description: '정기·특별휴가의 종류별 부여 기준과 신청 절차를 규정합니다.',
    pages: 26, size: '700KB', date: '2026.6.23',
    summary: '휴가의 종류(정기·포상·위로·청원 등)별 부여 일수와 신청·승인 절차를 규정합니다.',
  },
  {
    id: 'd10', category: 'GENERAL', categoryLabel: '일반', name: '외출·외박 승인 절차 안내서.pdf', badge: '안내',
    description: '외출·외박 신청부터 복귀 확인까지의 표준 절차를 안내합니다.',
    pages: 12, size: '380KB', date: '2026.6.15',
    summary: '외출·외박 신청 요건, 승인권자, 복귀 확인 및 미복귀 시 조치 절차를 안내합니다.',
  },
  {
    id: 'd11', category: 'GENERAL', categoryLabel: '일반', name: '청원휴가 운영기준.pdf', badge: '기준',
    description: '경조사 등 청원휴가의 사유별 인정 범위와 증빙 기준입니다.',
    pages: 10, size: '320KB', date: '2026.5.20',
    summary: '경조사·질병 등 사유별 청원휴가 인정 일수와 필요한 증빙 서류 기준을 정리합니다.',
  },
  {
    id: 'd12', category: 'MANUAL', categoryLabel: '교범', name: '정신전력 교육 운영규정.pdf', badge: '규정',
    description: '정신전력 교육의 편성, 실시, 평가 기준을 규정합니다.',
    pages: 22, size: '650KB', date: '2026.6.1',
    summary: '정신전력 교육의 연간 편성 기준, 교관 자격, 교육 실시 및 평가 방법을 규정합니다.',
  },
  {
    id: 'd13', category: 'TECH', categoryLabel: '정보화·보안', name: '군사보안 업무훈령.pdf', badge: '훈령',
    description: '군사기밀 관리, 보안 점검, 사고 처리 절차를 규정합니다.',
    pages: 34, size: '1.1MB', date: '2026.6.18',
    summary: '군사기밀의 등급 분류와 취급 절차, 정기 보안 점검 및 보안 사고 처리 절차를 규정합니다.',
  },
  {
    id: 'd14', category: 'FINANCE_LEGAL', categoryLabel: '재무·법무', name: '징계 업무처리 규정.pdf', badge: '규정',
    description: '징계 사유, 절차, 양정 기준과 이의 절차를 규정합니다.',
    pages: 28, size: '820KB', date: '2026.5.25',
    summary: '징계 사유별 양정 기준과 징계위원회 구성·심의 절차, 항고 및 이의 신청 절차를 정합니다.',
  },
]
