export const UNTITLED = '제목 없음'

export const displaySessionTitle = (
  title?: string | null,
): { text: string; isUntitled: boolean } => {
  const trimmed = (title ?? '').trim()
  return trimmed
    ? { text: trimmed, isUntitled: false }
    : { text: UNTITLED, isUntitled: true }
}

// 세션 오류 코드별 문구. 대화를 열 때와, 목록에서 이름 변경·삭제를 하다 실패했을 때의 문구가 다르다.
export const SESSION_ERRORS = {
  /** 대화를 열 때 (채팅 화면·프로젝트 화면) */
  open: {
    SESSION_NOT_FOUND: '존재하지 않는 대화입니다.',
    SESSION_ACCESS_DENIED: '접근 권한이 없는 대화입니다.',
  },
  /** 이름 변경·즐겨찾기·삭제 */
  mutation: {
    SESSION_NOT_FOUND: '이미 삭제된 대화입니다.',
    SESSION_ACCESS_DENIED: '접근 권한이 없습니다.',
    UNAUTHORIZED: '인증이 만료되었습니다. 다시 로그인해주세요.',
  },
} satisfies Record<string, Record<string, string>>
