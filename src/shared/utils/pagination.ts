// useInfiniteQuery의 getNextPageParam. 서버 목록 응답은 두 가지 방식이다.

interface CursorPage {
  data: { data: { has_next: boolean; next_cursor?: string | null } }
}

/** 커서 방식(has_next·next_cursor): 다음 쪽의 커서. 없으면 undefined */
export const nextCursor = (lastPage: CursorPage): string | undefined => {
  const { has_next, next_cursor } = lastPage.data.data
  return has_next && next_cursor ? next_cursor : undefined
}

/** 오프셋 방식(has_more): 지금까지 받은 항목 수가 다음 오프셋. pick은 한 쪽에서 항목 배열을 꺼낸다 */
export const nextOffset =
  <D extends { has_more?: boolean }>(pick: (data: D) => unknown[]) =>
  (
    lastPage: { data: { data: D } },
    allPages: { data: { data: D } }[],
  ): number | undefined => {
    if (!lastPage.data.data.has_more) return undefined
    return allPages.reduce((acc, p) => acc + pick(p.data.data).length, 0)
  }
