// 프로젝트 기능 '화면 모델' 타입.
// 목록/상세/생성은 실제 API(useProject.ts)로 연결됐고, 스토어(projectStore.ts)가
// 서버 값(project_id/title/is_favorite/instructions)을 이 타입으로 매핑한다.
// files·chats·domain 등은 아직 서버 API가 없어 로컬 기본값/편집으로 유지되는 화면 전용 필드다.
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

