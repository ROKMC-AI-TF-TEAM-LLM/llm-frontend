import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../../api/store/chatStore';
import Toast from '../Toast';
import type { Message } from '../../../types';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageActions from './MessageActions';
import SourceBadge from './SourceBadge';
import ImageAttachment from './ImageAttachment';
import { MessagesSkeleton } from '../Skeleton';

interface MessageListProps {
  title: string;
  isLoading?: boolean;
}

export default function MessageList({ title, isLoading }: MessageListProps) {
  const messages = useChatStore((s) => s.messages);
  const regenerateMessage = useChatStore((s) => s.regenerateMessage);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  const [copyFailed, setCopyFailed] = useState(false);

  useEffect(() => { isFirstLoad.current = true; }, [title]);

  useEffect(() => {
    if (isLoading) return;
    const behavior = isFirstLoad.current ? 'instant' : 'smooth';
    isFirstLoad.current = false;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior });
    });
  }, [messages, isLoading]);

  const lastAssistantId = [...messages].reverse()
    .find((m) => m.role === 'assistant' && m.type === 'text' && m.status !== 'streaming')?.id;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => setCopyFailed(true));
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      <ChatHeader title={title} />
      {copyFailed && <Toast message="복사에 실패했습니다." onClose={() => setCopyFailed(false)} />}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 custom-scroll" aria-live="polite" aria-atomic="false">
        {isLoading ? (
          <MessagesSkeleton />
        ) : (
        <div className="max-w-3xl mx-auto">
        {messages.map((msg: Message) => {
          if (msg.type === 'image') {
            return (
              <ImageAttachment
                key={msg.id}
                filename={msg.filename}
                caption={msg.caption}
              />
            );
          }

          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="group/msg">
                <MessageBubble role="user" content={msg.content} />
                <MessageActions role="user" onCopy={() => handleCopy(msg.content)} createdAt={msg.createdAt} />
              </div>
            );
          }

          const isStreaming = msg.status === 'streaming';
          const isInterrupted = msg.status === 'interrupted';
          return (
            <div key={msg.id} className="group/msg">
              <MessageBubble role="assistant" content={msg.content} isStreaming={isStreaming} />
              {!isStreaming && (
                <>
                  <MessageActions
                    role="assistant"
                    onCopy={() => handleCopy(msg.content)}
                    onRegenerate={msg.id === lastAssistantId ? () => regenerateMessage(msg.id) : undefined}
                    createdAt={msg.createdAt}
                  />
                  {isInterrupted && (
                    <div className="flex items-center gap-3 ml-12 mb-3 px-4 py-2.5 rounded-xl border border-surface-border bg-surface-subtle text-sm text-text-secondary">
                      <svg className="w-4 h-4 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" />
                        <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
                      </svg>
                      <span>응답이 중단되었습니다.</span>
                      <button
                        onClick={() => regenerateMessage(msg.id)}
                        className="ml-auto px-3 py-1 rounded-lg border border-surface-border bg-surface text-sm text-text-primary hover:bg-surface-subtle transition-colors"
                      >
                        다시 시도
                      </button>
                    </div>
                  )}
                  <SourceBadge sources={msg.sources} />
                </>
              )}
            </div>
          );
        })}
      </div>
        )}
    </div>
    </div>
  );
}
