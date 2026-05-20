import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MessageList from '../ui/components/messages/MessageList';
import ChatInput from '../ui/components/chat/chatinput';
import { useChatStore } from '../api/store/chatStore';

export default function ChatPage() {
  const { id } = useParams();
  const sessionId = id ?? '';
  const title = '채팅';

  const connect = useChatStore((s) => s.connect);
  const disconnect = useChatStore((s) => s.disconnect);

  useEffect(() => {
    connect(sessionId);
    return () => disconnect();
  }, [sessionId, connect, disconnect]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <MessageList title={title} />
      </div>
      <div className="w-full px-4 py-2">
        <ChatInput />
      </div>
      <p className="text-xs text-center text-text-muted pb-2">
        ROKMCLLM은 AI이므로 실수를 할 수 있습니다. 중요한 정보는 재차 확인하십시오.
      </p>
    </div>
  );
}