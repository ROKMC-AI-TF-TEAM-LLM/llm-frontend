/** 제목이 없는 세션을 화면에 표시할 때 쓰는 대체 문구. */
export const UNTITLED = '제목 없음'

/**
 * 세션 제목을 화면용으로 정리한다.
 * 서버가 빈 문자열/공백/null을 주는 경우가 있어(제목 생성 실패, 즉시 생성된 세션 등)
 * 그때는 '제목 없음'을 회색으로 보여준다.
 *
 * @returns text = 표시할 문구, isUntitled = 대체 문구로 표시 중인지(회색 처리용)
 */
export const displaySessionTitle = (title?: string | null): { text: string; isUntitled: boolean } => {
  const trimmed = (title ?? '').trim()
  return trimmed ? { text: trimmed, isUntitled: false } : { text: UNTITLED, isUntitled: true }
}
