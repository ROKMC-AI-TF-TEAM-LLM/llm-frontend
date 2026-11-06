/** 프로젝트 화면에서 그리는 채팅 줄 */
export interface ProjectChat {
  id: string
  title: string
  updatedAt: string
  messageCount: number
  isFavorite?: boolean
}
