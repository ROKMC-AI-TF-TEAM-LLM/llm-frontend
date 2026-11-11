// 날짜·시간 표시. 화면마다 형식이 달라 용도별로 함수를 둔다.
// toLocale* 호출은 이 파일에만 둔다.

const LOCALE = 'ko-KR'

/** `2026. 11. 1.` — 표의 날짜 칸 (관리자 사용자·문서 목록) */
export const formatDate = (iso: string): string => new Date(iso).toLocaleDateString(LOCALE)

/** `2026. 11. 1. 오전 9:05:00` — 대화 검색 결과 */
export const formatDateTime = (iso: string): string => new Date(iso).toLocaleString(LOCALE)

/** `2026년 11월 1일 오전 09:05` — 관리자 사용자 상세 */
export const formatDateTimeLong = (iso: string): string =>
  new Date(iso).toLocaleDateString(LOCALE, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })

/** `오전 9:05` — 프로젝트 대화 목록, 문서 제작 작업. 값이 없거나 날짜가 아니면 빈 문자열 */
export const formatClock = (iso?: string | null): string => {
  if (!iso) return ''
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  return new Date(t).toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit' })
}
