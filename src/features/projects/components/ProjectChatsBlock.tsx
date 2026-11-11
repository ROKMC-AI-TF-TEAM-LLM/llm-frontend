import type { ProjectChat } from '../types'
import IconButton from '@/shared/components/IconButton'
import { Block } from './Block'
import { ChatRow } from './ChatRow'
import { NewChatIcon } from './icons'

interface ProjectChatsBlockProps {
  chats: ProjectChat[]
  /** 지금 열려 있는 대화 */
  openChatId: string | null
  onOpen: (chatId: string) => void
  /** 이 프로젝트에서 새 채팅 */
  onNew: () => void
  onToggleFavorite: (chatId: string) => void
  onRename: (chatId: string, next: string) => void
  onDelete: (chatId: string) => void
}

/** 프로젝트 화면 왼쪽 패널의 대화 영역 */
export function ProjectChatsBlock({
  chats,
  openChatId,
  onOpen,
  onNew,
  onToggleFavorite,
  onRename,
  onDelete,
}: ProjectChatsBlockProps) {
  return (
    <Block
      title={`대화 ${chats.length}`}
      action={
        <IconButton label="이 프로젝트에서 새 채팅" onClick={onNew}>
          <NewChatIcon className="h-4 w-4" />
        </IconButton>
      }
    >
      <div className="-mx-2">
        {chats.map((c) => (
          <ChatRow
            key={c.id}
            chat={c}
            active={c.id === openChatId}
            onClick={() => onOpen(c.id)}
            onToggleFavorite={() => onToggleFavorite(c.id)}
            onRename={(next) => onRename(c.id, next)}
            onDelete={() => onDelete(c.id)}
          />
        ))}
        {chats.length === 0 && (
          <p className="py-6 text-center text-13 text-text-muted">
            아직 대화가 없습니다.
          </p>
        )}
      </div>
    </Block>
  )
}
