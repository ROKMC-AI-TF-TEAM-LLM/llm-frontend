import { useNavigate, useParams } from 'react-router-dom'
import type { ChatItem } from '@/features/chat/types'
import { useConfirmDeleteSession, useUpdateSession, useToggleFavorite } from '@/features/sessions/hooks'
import { displaySessionTitle } from '@/features/sessions/utils'
import SidebarItem from './SidebarItem'

interface SessionItemProps {
  chat: ChatItem
}

// 실패 알림은 각 mutation 훅에서 띄운다(행이 언마운트돼도 알림이 남도록).
export default function SessionItem({ chat }: SessionItemProps) {
  const navigate = useNavigate()
  const { id: routeId, chatId: routeChatId } = useParams()
  const { mutate: updateSession } = useUpdateSession()
  const confirmDelete = useConfirmDeleteSession()
  const { mutate: toggleFavorite } = useToggleFavorite()

  const { text: titleText, isUntitled } = displaySessionTitle(chat.title)

  return (
    <SidebarItem
      kind="chat"
      name={chat.title}
      isActive={chat.id === (routeChatId ?? routeId)}
      isFavorite={!!chat.isFavorite}
      labels={{ rename: '제목 수정', remove: '세션 삭제' }}
      onOpen={() => navigate(chat.projectId ? `/projects/${chat.projectId}/${chat.id}` : `/chat/${chat.id}`)}
      onRename={(title) => updateSession({ sessionId: chat.id, data: { title } })}
      onToggleFavorite={() => toggleFavorite({ sessionId: chat.id, next: !chat.isFavorite })}
      onDelete={() => confirmDelete({ id: chat.id, title: chat.title, projectId: chat.projectId })}
    >
      <span className={`truncate overflow-hidden ${isUntitled ? 'text-text-muted font-normal' : ''}`}>{titleText}</span>
    </SidebarItem>
  )
}
