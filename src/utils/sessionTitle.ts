export const UNTITLED = '제목 없음'

export const displaySessionTitle = (title?: string | null): { text: string; isUntitled: boolean } => {
  const trimmed = (title ?? '').trim()
  return trimmed ? { text: trimmed, isUntitled: false } : { text: UNTITLED, isUntitled: true }
}
