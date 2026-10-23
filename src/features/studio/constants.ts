import type { DocGenKind, DocGenPageElement } from '../../types/docgen'

/** 쪽·장을 그리는 실제 크기(px). 발표 자료는 16:9, 문서는 A4 */
export const FRAME: Record<DocGenKind, { w: number; h: number }> = {
  deck: { w: 960, h: 540 },
  doc: { w: 794, h: 1123 },
}

export const ELEMENT_LABEL: Record<DocGenPageElement, string> = {
  title: '제목',
  subtitle: '부제',
  bullets: '글머리표',
  columns: '두 단',
  table: '표',
  chart: '그래프',
  body: '본문',
}
