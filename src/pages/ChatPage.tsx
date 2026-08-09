import { useEffect, useLayoutEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import MessageList from '../ui/components/messages/MessageList';
import ChatInput from '../ui/components/chat/ChatInput';
import Toast from '../ui/components/Toast';
import { useChatStore } from '../api/store/chatStore';
import { useInfiniteSessions } from '../hooks/useSession';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { isNetworkError } from '../utils/error';
import { logError } from '../utils/logError';
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
  const [canRetry, setCanRetry] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const { data: infiniteData } = useInfiniteSessions();
  const allSessions = (infiniteData?.pages ?? []).flatMap((p) => p.data.data.items);
  const currentSession = allSessions.find((s: SessionData) => s.session_id === sessionId);
  const title = currentSession?.title ?? '채팅';
  useDocumentTitle(title);

  const connect = useChatStore((s) => s.connect);
  const error = useChatStore((s) => s.error);
  const clearError = useChatStore((s) => s.clearError);
  const isDeleted = useChatStore((s) => s.isDeleted);
  const resetDeleted = useChatStore((s) => s.resetDeleted);
  const isConnecting = useChatStore((s) => s.isConnecting);

  useEffect(() => {
    if (isDeleted) {
      const msg = error;
      resetDeleted();
      clearError();
      navigate('/chat', { replace: true, state: { toastError: msg } });
    }
  }, [isDeleted, error, resetDeleted, clearError, navigate]);

  useLayoutEffect(() => {
    const initialMessage = location.state?.initialMessage as string | undefined;
    let cancelled = false;

    connect(sessionId)
      .then(() => {
        if (cancelled) return;
        if (initialMessage) {
          navigate(location.pathname, { replace: true, state: {} });
        }
      })
      .catch((error) => {
        if (cancelled) return;
        logError('ChatPage.connect', error, { sessionId });

        const code = error?.response?.data?.error?.code;
        const status = (error?.response?.status ?? 0) as number;
        const knownMessage = SESSION_ERRORS[code];
        if (knownMessage) {
          setCanRetry(false);
          setSessionError(knownMessage);
        } else if (status >= 500) {
          const detail = error?.response?.data?.error?.detail;
          setCanRetry(true);
          setSessionError(
            detail
              ? `서버에 일시적인 오류가 발생했습니다. (${status}: ${detail})`
              : `서버에 일시적인 오류가 발생했습니다. (${status})`,
          );
        } else if (isNetworkError(error)) {
          setCanRetry(true);
          setSessionError('서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
        } else {
          navigate('/chat', { replace: true, state: { toastError: '채팅을 불러오는 중 오류가 발생했습니다.' } });
        }
      });

    return () => { cancelled = true; };
  }, [sessionId, retryKey]);

  if (sessionError) {
    const isServerError = canRetry;
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
      <div className="shrink-0 bg-surface px-4 pb-2">
        <ChatInput isConnecting={isConnecting} />
        <p className="text-xs text-center text-text-muted pt-2">
          MARS v1.0.0은 AI이므로 실수를 할 수 있습니다. 중요한 정보는 재차 확인하십시오.
        </p>
      </div>
      {error && <Toast message={error} onClose={clearError} />}
    </div>
  );
}
