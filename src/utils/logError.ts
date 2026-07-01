// 에러를 콘솔에 일관된 형식으로 남긴다. 각 에러 분기에서 context를 붙여 호출한다.
// 끄고 싶으면 이 함수 본문만 비우면 전체가 조용해진다.
export const logError = (context: string, error: unknown, extra?: unknown): void => {
  if (extra !== undefined) {
    console.error(`[${context}]`, error, extra)
  } else {
    console.error(`[${context}]`, error)
  }
}
