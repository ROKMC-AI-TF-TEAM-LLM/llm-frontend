import { useEffect, useEffectEvent, useLayoutEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import MessageList from '../components/MessageList';
import ChatInput from '../components/ChatInput';
import { showToast } from '@/shared/store/toastStore';
import { useChatStore } from '../store';
import { useInfiniteSessions } from '@/features/sessions/hooks';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { isNetworkError, readApiError } from '@/shared/utils/error';
import { SESSION_ERRORS } from '@/features/sessions/utils';
import { logError } from '@/shared/utils/logError';
import { AI_NOTICE } from '@/shared/constants';
import Button from '@/shared/components/Button';
import type { SessionData } from '@/features/sessions/types';

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
      return;
    }
    if (error) {
      showToast(error);
      clearError();
    }
  }, [isDeleted, error, resetDeleted, clearError, navigate]);

  // 연결은 대화(sessionId)가 바뀌거나 다시 시도할 때만 한다.
  // 주소·이동 함수는 바뀌어도 다시 연결하지 않도록 effect event로 그때의 최신 값을 읽는다.
  const readInitialMessage = useEffectEvent(() => location.state?.initialMessage as string | undefined);
  const clearInitialMessage = useEffectEvent(() => {
    navigate(location.pathname, { replace: true, state: {} });
  });
  const handleConnectError = useEffectEvent((error: unknown) => {
        logError('ChatPage.connect', error, { sessionId });

        const { code, detail, status = 0 } = readApiError(error);
        const knownMessage = (SESSION_ERRORS.chat as Record<string, string>)[code ?? ''];
        if (knownMessage) {
          setCanRetry(false);
          setSessionError(knownMessage);
        } else if (status >= 500) {
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

  useLayoutEffect(() => {
    const initialMessage = readInitialMessage();
    let cancelled = false;

    connect(sessionId)
      .then(() => {
        if (cancelled) return;
        if (initialMessage) clearInitialMessage();
      })
      .catch((error) => {
        if (cancelled) return;
        handleConnectError(error);
      });

    return () => { cancelled = true; };
  }, [sessionId, retryKey, connect]);

  if (sessionError) {
    const isServerError = canRetry;
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-text-secondary">{sessionError}</p>
        {isServerError ? (
          <Button variant="link" onClick={() => { setSessionError(''); setRetryKey((k) => k + 1); }}>
            다시 시도
          </Button>
        ) : (
          <Button variant="link" onClick={() => navigate('/chat', { replace: true })}>
            새 채팅으로 이동
          </Button>
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
          {AI_NOTICE}
        </p>
      </div>
    </div>
  );
}
