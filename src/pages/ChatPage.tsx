import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import MessageList from '../ui/components/messages/MessageList';
import ChatInput from '../ui/components/chat/ChatInput';
import Toast from '../ui/components/Toast';
import { useChatStore, saveInflight } from '../api/store/chatStore';
import { useInfiniteSessions } from '../hooks/useSession';
import { isNetworkError } from '../utils/error';
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
  const [retryKey, setRetryKey] = useState(0);

  const { data: infiniteData } = useInfiniteSessions();
  const allSessions = (infiniteData?.pages ?? []).flatMap((p) => p.data.data.items);
  const currentSession = allSessions.find((s: SessionData) => s.session_id === sessionId);
  const title = currentSession?.title ?? '채팅';

  const connect = useChatStore((s) => s.connect);
  const error = useChatStore((s) => s.error);
  const clearError = useChatStore((s) => s.clearError);
  const isDeleted = useChatStore((s) => s.isDeleted);
  const resetDeleted = useChatStore((s) => s.resetDeleted);

  useEffect(() => {
    if (isDeleted) {
      const msg = error;
      resetDeleted();
      clearError();
      navigate('/chat', { replace: true, state: { toastError: msg } });
    }
  }, [isDeleted, error, resetDeleted, clearError, navigate]);

  useEffect(() => {
    const initialMessage = location.state?.initialMessage as string | undefined;
    let cancelled = false;
    // 스토어에 이미 이 세션 메시지가 있으면 로딩 스켈레톤 생략(재진입 시 깜빡임/빈 화면 방지)
    const store = useChatStore.getState();
    const hasCached = store.sessionId === sessionId && store.messages.length > 0;
    setIsConnecting(!hasCached);

    if (initialMessage) {
      saveInflight(sessionId, initialMessage);
    }

    connect(sessionId)
      .then(() => {
        if (cancelled) return;
        setIsConnecting(false);
        if (initialMessage) {
          navigate(location.pathname, { replace: true, state: {} });
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setIsConnecting(false);
        const code = error?.response?.data?.error?.code;
        const status = (error?.response?.status ?? 0) as number;
        const knownMessage = SESSION_ERRORS[code];
        if (knownMessage) {
          setSessionError(knownMessage);
        } else if (status >= 500 || isNetworkError(error)) {
          // 서버 오류(5xx) 또는 네트워크 오류 → 페이지 내에서 재시도 유도 (navigate 하지 않음)
          setSessionError('서버에 일시적인 오류가 발생했습니다.');
        } else {
          navigate('/chat', { replace: true, state: { toastError: '채팅을 불러오는 중 오류가 발생했습니다.' } });
        }
      });

    return () => { cancelled = true; };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, retryKey]);

  if (sessionError) {
    const isServerError = sessionError === '서버에 일시적인 오류가 발생했습니다.';
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-text-secondary">{sessionError}</p>
        {isServerError ? (
          <button
            onClick={() => { setSessionError(''); setRetryKey((k) => k + 1); }}
            className="text-sm text-brand hover:underline"
          >
            다시 시도
          </button>
        ) : (
          <button
            onClick={() => navigate('/chat', { replace: true })}
            className="text-sm text-brand hover:underline"
          >
            새 채팅으로 이동
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <MessageList title={title} isLoading={isConnecting} />
      </div>
      <div className="w-full px-4 py-2">
        <ChatInput isConnecting={isConnecting} />
      </div>
      <p className="text-xs text-center text-text-muted pb-2">
        ROKMCLLM은 AI이므로 실수를 할 수 있습니다. 중요한 정보는 재차 확인하십시오.
      </p>
      {error && <Toast message={error} onClose={clearError} />}
    </div>
  );
}
