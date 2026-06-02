import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import MessageList from '../ui/components/messages/MessageList';
import ChatInput from '../ui/components/chat/chatinput';
import Toast from '../ui/components/Toast';
import { useChatStore, saveInflight } from '../api/store/chatStore';
import { useGetSessions } from '../hooks/useSession';
import type { SessionData } from '../types/session';

const SESSION_ERRORS: Record<string, string> = {
  SESSION_NOT_FOUND: '존재하지 않는 세션입니다.',
  SESSION_ACCESS_DENIED: '접근 권한이 없는 세션입니다.',
};

export default function ChatPage() {
  const { id } = useParams();
  const sessionId = id ?? '';
  const location = useLocation();
  const navigate = useNavigate();
  const [sessionError, setSessionError] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);

  const { data: sessionsData } = useGetSessions();
  const sessions: SessionData[] = sessionsData?.data?.data?.items ?? [];
  const currentSession = sessions.find((s: SessionData) => s.session_id === sessionId);
  const title = currentSession?.title ?? '채팅';

  const connect = useChatStore((s) => s.connect);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const error = useChatStore((s) => s.error);
  const clearError = useChatStore((s) => s.clearError);

  useEffect(() => {
    const initialMessage = location.state?.initialMessage as string | undefined;
    setIsConnecting(true);

    if (initialMessage) {
      saveInflight(sessionId, initialMessage);
    }

    connect(sessionId)
      .then(() => {
        setIsConnecting(false);
        if (initialMessage) {
          navigate(location.pathname, { replace: true, state: {} });
          sendMessage(initialMessage);
        }
      })
      .catch((error) => {
        setIsConnecting(false);
        const code = error?.response?.data?.error?.code;
        const message = SESSION_ERRORS[code];
        if (message) {
          setSessionError(message);
        } else {
          navigate('/chat', { replace: true });
        }
      });
  
  }, [sessionId]);

  if (sessionError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-text-secondary">{sessionError}</p>
        <button
          onClick={() => navigate('/chat', { replace: true })}
          className="text-sm text-brand hover:underline"
        >
          새 채팅으로 이동
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <MessageList title={title} isLoading={isConnecting} />
      </div>
      <div className="w-full px-4 py-2">
        <ChatInput />
      </div>
      <p className="text-xs text-center text-text-muted pb-2">
        ROKMCLLM은 AI이므로 실수를 할 수 있습니다. 중요한 정보는 재차 확인하십시오.
      </p>
      {error && <Toast message={error} onClose={clearError} />}
    </div>
  );
}
