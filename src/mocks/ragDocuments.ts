// RAG 문서 목업 데이터.
// 실제 API 타입은 추후 확정 예정 — 지금은 이 뷰모델(RagDoc)로 디자인을 구현해두고,
// API가 오면 이 파일을 실제 fetch로 교체하고 매핑만 맞추면 된다.

export type RagCategory =
  | '인사관리'
  | '복무규정'
  | '휴가·외출외박'
  | '교육훈련'
  | '보안·징계'

export interface RagDoc {
  id: string
  category: RagCategory
  name: string        // 파일명 (예: 군인사법 시행규칙.pdf)
  badge: string       // 문서 종류 라벨 (예: 시행규칙, 지침, 편람)
  description: string // 리스트에 보이는 한 줄 설명
  pages: number       // 페이지 수
  size: string        // 용량 라벨 (예: 1.2MB)
  date: string        // 등록일 라벨 (예: 2026.6.20)
  summary: string     // 상세 화면의 문서 요약
}

// 카테고리별 색상(리스트 좌측 보더 / 상세 뱃지). 도메인 확정 시 값만 조정하면 됨.
export const CATEGORY_STYLE: Record<
  RagCategory,
  { bar: string; badgeBg: string; badgeText: string }
> = {
  '인사관리': { bar: '#e4002b', badgeBg: '#fdeef1', badgeText: '#c0002a' },
  '복무규정': { bar: '#3b6fe0', badgeBg: '#eaf0fd', badgeText: '#2a54b8' },
  '휴가·외출외박': { bar: '#e0952b', badgeBg: '#fbf1e2', badgeText: '#b3720f' },
  '교육훈련': { bar: '#10b981', badgeBg: '#e6f7f1', badgeText: '#0a7d5a' },
  '보안·징계': { bar: '#8b5cf6', badgeBg: '#f1ecfe', badgeText: '#6b3fd4' },
}

export const MOCK_RAG_DOCS: RagDoc[] = [
  {
    id: 'd1', category: '인사관리', name: '군인사법 시행규칙.pdf', badge: '시행규칙',
    description: '진급, 보직, 전출입 등 인사 행정 전반의 시행 절차를 규정합니다.',
    pages: 42, size: '1.2MB', date: '2026.6.20',
    summary: '군인사법의 위임에 따라 진급·보직·전출입 등 인사 행정 전반의 구체적 시행 절차와 서식을 규정한 시행규칙입니다.',
  },
  {
    id: 'd2', category: '인사관리', name: '진급심사 운영지침.pdf', badge: '지침',
    description: '계급별 진급 대상자 선발 기준과 심사위원회 운영 절차를 안내합니다.',
    pages: 18, size: '640KB', date: '2026.6.18',
    summary: '계급별 진급 대상자 선발 기준, 심사위원회 구성·운영, 이의신청 절차를 안내하는 운영지침입니다.',
  },
  {
    id: 'd3', category: '인사관리', name: '전출입 관리 규정.pdf', badge: '규정',
    description: '부대 간 전출입 신청, 승인, 후속 조치 절차를 규정합니다.',
    pages: 24, size: '880KB', date: '2026.5.30',
    summary: '부대 간 전출입 신청부터 승인, 인수인계 및 후속 조치까지의 관리 절차를 규정합니다.',
  },
  {
    id: 'd4', category: '인사관리', name: '병적관리 업무편람.pdf', badge: '편람',
    description: '병적 등록, 변동사항 관리, 전산 처리 기준을 정리한 실무 편람입니다.',
    pages: 56, size: '2.1MB', date: '2026.5.12',
    summary: '병적 등록, 변동사항 관리, 전산 처리 기준을 정리한 실무 편람입니다.',
  },
  {
    id: 'd5', category: '복무규정', name: '군인의 지위 및 복무에 관한 기본법.pdf', badge: '법률',
    description: '군인의 기본적 지위와 복무에 관한 원칙을 규정한 상위 법률입니다.',
    pages: 38, size: '1.0MB', date: '2026.6.23',
    summary: '군인의 기본적 지위와 권리·의무, 복무의 기본 원칙을 규정한 상위 법률입니다.',
  },
  {
    id: 'd6', category: '복무규정', name: '병 복무규정 시행세칙.pdf', badge: '세칙',
    description: '병 계급의 일상 복무, 생활 통제, 준수사항을 세부적으로 규정합니다.',
    pages: 30, size: '900KB', date: '2026.6.10',
    summary: '병 계급의 일상 복무, 생활 통제, 준수사항을 세부적으로 규정한 시행세칙입니다.',
  },
  {
    id: 'd7', category: '복무규정', name: '근무기강 확립 지침.pdf', badge: '지침',
    description: '복무 기강 저해 행위 예방과 지도 감독 절차를 안내합니다.',
    pages: 14, size: '410KB', date: '2026.5.28',
    summary: '복무 기강 저해 행위의 예방, 지도·감독 절차 및 조치 기준을 안내하는 지침입니다.',
  },
  {
    id: 'd8', category: '복무규정', name: '당직근무 운영규칙.pdf', badge: '규칙',
    description: '당직 편성, 근무 수칙, 인수인계 절차를 규정합니다.',
    pages: 20, size: '560KB', date: '2026.5.2',
    summary: '당직 편성 기준, 근무 수칙, 인수인계 및 보고 절차를 규정한 운영규칙입니다.',
  },
  {
    id: 'd9', category: '휴가·외출외박', name: '군인 휴가 규정 시행령.pdf', badge: '시행령',
    description: '정기·특별휴가의 종류별 부여 기준과 신청 절차를 규정합니다.',
    pages: 26, size: '700KB', date: '2026.6.23',
    summary: '정기휴가·특별휴가 등 종류별 부여 기준, 일수 산정, 신청·승인 절차를 규정한 시행령입니다.',
  },
  {
    id: 'd10', category: '휴가·외출외박', name: '외출·외박 승인 절차 안내서.pdf', badge: '안내',
    description: '외출·외박 신청부터 복귀 확인까지의 표준 절차를 안내합니다.',
    pages: 12, size: '380KB', date: '2026.6.15',
    summary: '외출·외박 신청부터 승인, 복귀 확인까지의 표준 처리 절차를 안내하는 안내서입니다.',
  },
  {
    id: 'd11', category: '휴가·외출외박', name: '청원휴가 운영기준.pdf', badge: '기준',
    description: '경조사 등 청원휴가의 사유별 인정 범위와 증빙 기준을 정합니다.',
    pages: 16, size: '470KB', date: '2026.5.24',
    summary: '경조사 등 청원휴가의 사유별 인정 범위, 일수, 증빙 서류 기준을 정한 운영기준입니다.',
  },
  {
    id: 'd12', category: '교육훈련', name: '정신전력 교육 운영규정.pdf', badge: '규정',
    description: '정신전력 교육의 편성, 실시 방법, 평가 기준을 규정합니다.',
    pages: 22, size: '650KB', date: '2026.6.5',
    summary: '정신전력 교육의 연간 편성, 실시 방법, 평가 및 환류 기준을 규정합니다.',
  },
  {
    id: 'd13', category: '보안·징계', name: '군사보안 업무훈령.pdf', badge: '훈령',
    description: '군사기밀 관리와 보안사고 예방·처리 절차를 규정합니다.',
    pages: 34, size: '1.1MB', date: '2026.6.12',
    summary: '군사기밀의 분류·관리, 보안점검, 보안사고 예방 및 처리 절차를 규정한 훈령입니다.',
  },
  {
    id: 'd14', category: '보안·징계', name: '징계 업무처리 규정.pdf', badge: '규정',
    description: '징계 사유별 양정 기준과 심의·집행 절차를 규정합니다.',
    pages: 28, size: '820KB', date: '2026.5.18',
    summary: '징계 사유별 양정 기준, 징계위원회 심의, 집행 및 이의신청 절차를 규정합니다.',
  },
]
