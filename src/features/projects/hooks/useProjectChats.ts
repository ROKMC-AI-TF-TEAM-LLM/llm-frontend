import { useMemo } from 'react'
import {
  useUpdateSession,
  useToggleFavorite as useToggleSessionFavorite,
  useConfirmDeleteSession,
} from '@/features/sessions/hooks'
import { formatClock } from '@/shared/utils/date'
import type { ProjectChat } from '../types'
import { useProjectSessions } from './queries'

/** 프로젝트 안의 대화 목록과 이름 변경·즐겨찾기·삭제 (프로젝트 화면의 대화 영역) */
export function useProjectChats(id: string | undefined) {
  const { data: sessionsData } = useProjectSessions(id)
  // 쿼리 캐시에서 파생한다. 로컬 state로 복사해두면 뮤테이션 후 refetch가
  // 낙관적 수정을 덮어써서 값이 되돌아갔다 다시 바뀌는 깜빡임이 생긴다.
  const chats: ProjectChat[] = useMemo(() => {
    if (!sessionsData) return []
    return sessionsData.pages
      .flatMap((p) => p.data.data.items)
      .map((s) => ({
        id: s.session_id,
        title: s.title,
        isFavorite: s.is_favorite,
        updatedAt: formatClock(s.updated_at),
        messageCount: 0,
      }))
  }, [sessionsData])
  const { mutate: updateSessionApi } = useUpdateSession()
  const { mutate: toggleSessionFavoriteApi } = useToggleSessionFavorite()
  const confirmDeleteChat = useConfirmDeleteSession()

  const renameChat = (targetId: string, next: string) => {
    updateSessionApi({ sessionId: targetId, data: { title: next } })
  }
  const toggleChatFavorite = (targetId: string) => {
    const cur = chats.find((c) => c.id === targetId)
    toggleSessionFavoriteApi({
      sessionId: targetId,
      next: !(cur?.isFavorite ?? false),
    })
  }
  const deleteChat = (targetId: string) => {
    // 확인 창, 열려 있던 대화면 프로젝트 첫 화면으로 이동, 실패 알림은 훅이 맡는다.
    const target = chats.find((c) => c.id === targetId)
    confirmDeleteChat({ id: targetId, title: target?.title, projectId: id })
  }

  return { chats, renameChat, toggleChatFavorite, deleteChat }
}
