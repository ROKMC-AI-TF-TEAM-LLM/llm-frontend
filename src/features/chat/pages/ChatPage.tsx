import { useParams, useLocation, useNavigate } from 'react-router-dom'
import MessageList from '../components/MessageList'
import ChatInput from '../components/ChatInput'
import { useChatSession } from '../hooks'
import { useInfiniteSessions } from '@/features/sessions/hooks'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { SESSION_ERRORS } from '@/features/sessions/utils'
import { AI_NOTICE } from '@/shared/constants'
import Button from '@/shared/components/Button'
import type { SessionData } from '@/features/sessions/types'

export default function ChatPage() {
  const { id } = useParams()
  const sessionId = id ?? ''
  const location = useLocation()
  const navigate = useNavigate()

  const { data: infiniteData } = useInfiniteSessions()
  const allSessions = (infiniteData?.pages ?? []).flatMap(
    (p) => p.data.data.items,
  )
  const currentSession = allSessions.find(
    (s: SessionData) => s.session_id === sessionId,
  )
  const title = currentSession?.title ?? '채팅'
  useDocumentTitle(title)

  const { isConnecting, connectError, retry } = useChatSession(sessionId, {
    knownErrors: SESSION_ERRORS.open,
    logLabel: 'ChatPage.connect',
    logContext: { sessionId },
    onUnknownError: () =>
      navigate('/chat', {
        replace: true,
        state: { toastError: '채팅을 불러오는 중 오류가 발생했습니다.' },
      }),
    onDeleted: (message) =>
      navigate('/chat', { replace: true, state: { toastError: message } }),
    // 새 채팅에서 넘어올 때 주소에 실려 온 첫 질문은 연결된 뒤 지운다(새로고침 때 다시 보내지 않도록).
    onConnected: () => {
      if (location.state?.initialMessage)
        navigate(location.pathname, { replace: true, state: {} })
    },
  })

  if (connectError) {
    const isServerError = connectError.canRetry
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-text-secondary">{connectError.message}</p>
        {isServerError ? (
          <Button variant="link" onClick={retry}>
            다시 시도
          </Button>
        ) : (
          <Button
            variant="link"
            onClick={() => navigate('/chat', { replace: true })}
          >
            새 채팅으로 이동
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <MessageList title={title} isLoading={isConnecting} />
      </div>
      <div className="shrink-0 bg-surface px-4 pb-2">
        <ChatInput isConnecting={isConnecting} />
        <p className="text-xs text-center text-text-muted pt-2">{AI_NOTICE}</p>
      </div>
    </div>
  )
}
