export type GuideSection = {
  id: string
  label: string
  desc: string
}

export const GUIDE_SECTIONS: GuideSection[] = [
  { id: 'step-01', label: '질문 입력', desc: '궁금한 규정을 평소 말하듯 물어보세요.' },
  { id: 'step-02', label: '도메인 선택', desc: '분야를 좁혀 더 정확한 근거를 찾습니다.' },
  { id: 'step-03', label: '실시간 답변', desc: '근거를 찾아 즉시 스트리밍으로 답합니다.' },
  { id: 'step-04', label: '출처 확인', desc: '참고한 문서 원문을 바로 펼쳐 봅니다.' },
]

export const GUIDE_EXTRAS: GuideSection[] = [
  { id: 'smart', label: '이런 점이 다릅니다', desc: '근거 없이는 추측하지 않습니다.' },
  { id: 'tips', label: '더 정확하게 쓰는 법', desc: '같은 질문도 다듬으면 달라집니다.' },
  { id: 'faq', label: '자주 묻는 질문', desc: '쓰기 전 궁금한 것들을 모았습니다.' },
]
