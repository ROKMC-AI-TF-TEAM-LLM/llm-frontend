/**
 * 가이드 페이지의 섹션 목록 — 랜딩 상단 네비와 가이드 페이지가 함께 쓴다.
 *
 * 한 곳에서 관리해야 네비의 항목과 실제 섹션 id가 어긋나지 않는다.
 * (네비에서 /guide#step-01로 이동하면 가이드 페이지가 해당 섹션으로 스크롤한다)
 */
export type GuideSection = {
  /** 가이드 페이지 섹션의 id이자 URL 해시 */
  id: string
  /** 네비에 보이는 이름 */
  label: string
  /** 네비 항목 아래 한 줄 설명 */
  desc: string
}

export const GUIDE_SECTIONS: GuideSection[] = [
  { id: 'step-01', label: '질문 입력', desc: '궁금한 규정을 평소 말하듯 물어보세요.' },
  { id: 'step-02', label: '도메인 선택', desc: '분야를 좁혀 더 정확한 근거를 찾습니다.' },
  { id: 'step-03', label: '실시간 답변', desc: '근거를 찾아 즉시 스트리밍으로 답합니다.' },
  { id: 'step-04', label: '출처 확인', desc: '참고한 문서 원문을 바로 펼쳐 봅니다.' },
]

/** 네비 오른쪽에 함께 노출할 보조 항목 */
export const GUIDE_EXTRAS: GuideSection[] = [
  { id: 'smart', label: '이런 점이 다릅니다', desc: '근거 없이는 추측하지 않습니다.' },
  { id: 'tips', label: '더 정확하게 쓰는 법', desc: '같은 질문도 다듬으면 달라집니다.' },
  { id: 'faq', label: '자주 묻는 질문', desc: '쓰기 전 궁금한 것들을 모았습니다.' },
]
