import ChatInput from '@/features/chat/components/ChatInput'
import MessageList from '@/features/chat/components/MessageList'
import Button from '@/shared/components/Button'
import { AI_NOTICE } from '@/shared/constants'

interface ProjectChatAreaProps {
  project: { id: string; name: string }
  /** 열려 있는 대화. 없으면 프로젝트 첫 화면(새 채팅 입력) */
  openChatId: string | null
  /** 대화 연결 오류 문구 */
  connectError: string | null
  onRetry: () => void
  isConnecting: boolean
}

/** 프로젝트 화면 오른쪽: 열린 대화, 연결 오류, 또는 새 채팅 입력 */
export function ProjectChatArea({ project, openChatId, connectError, onRetry, isConnecting }: ProjectChatAreaProps) {
  return openChatId && connectError ? (
  <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6">
    <p className="text-text-secondary">{connectError}</p>
    <Button variant="link" onClick={onRetry}>
      다시 시도
    </Button>
  </div>
) : openChatId ? (
  <div className="flex min-h-0 flex-1 flex-col">
    <div className="flex-1 min-h-0">
      <MessageList title={project.name} isLoading={isConnecting} hideHeader />
    </div>
    <div className="shrink-0 bg-surface px-4 pb-2">
      <ChatInput isConnecting={isConnecting} hideDomain />
      <p className="text-xs text-center text-text-muted pt-2">{AI_NOTICE}</p>
    </div>
  </div>
) : (
  <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8">
    <div className="w-full max-w-[720px] animate-page-in">
      <p className="mb-6 text-center text-14 text-text-muted">
        MARS는 이 프로젝트에서 대화할 때마다 동일한 지침과 파일을 참조합니다.
      </p>
      <ChatInput projectId={project.id} hideDomain notice={AI_NOTICE} />
    </div>
  </div>
)
}
