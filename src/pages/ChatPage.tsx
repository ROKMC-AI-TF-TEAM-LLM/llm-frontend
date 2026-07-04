import { useEffect, useLayoutEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import MessageList from '../ui/components/messages/MessageList';
import ChatInput from '../ui/components/chat/ChatInput';
import Toast from '../ui/components/Toast';
import { useChatStore, saveInflight, peekSessionMessages } from '../api/store/chatStore';
import { useInfiniteSessions } from '../hooks/useSession';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
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
  // 캐시된 세션이면 스켈레톤 없이 바로 표시(첫 렌더부터 false)
  const [isConnecting, setIsConnecting] = useState(() => peekSessionMessages(sessionId).length === 0);
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

  useEffect(() => {
    if (isDeleted) {
      const msg = error;
      resetDeleted();
      clearError();
      navigate('/chat', { replace: true, state: { toastError: msg } });
    }
  }, [isDeleted, error, resetDeleted, clearError, navigate]);

  // paint 전에 스토어를 현재 세션 캐시로 맞춰(useLayoutEffect) 이전 세션 잔상/깜빡 방지
  useLayoutEffect(() => {
    const initialMessage = location.state?.initialMessage as string | undefined;
    let cancelled = false;
    const hasCached = peekSessionMessages(sessionId).length > 0;
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
          setSessionError('서버에 일시적인 오류가 발생했습니다.');
        } else {
          navigate('/chat', { replace: true, state: { toastError: '채팅을 불러오는 중 오류가 발생했습니다.' } });
        }
      });

    return () => { cancelled = true; };
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
    <div className="relative h-full">
      <MessageList title={title} isLoading={isConnecting} />
      <div className="pointer-events-none absolute bottom-0 left-0 right-2.5 px-4 pt-3">
        <div className="pointer-events-auto bg-surface pb-2">
          <ChatInput isConnecting={isConnecting} />
          <p className="text-xs text-center text-text-muted pt-2">
            MARS는 AI이므로 실수를 할 수 있습니다. 중요한 정보는 재차 확인하십시오.
          </p>
        </div>
      </div>
      {error && <Toast message={error} onClose={clearError} />}
    </div>
  );
}
