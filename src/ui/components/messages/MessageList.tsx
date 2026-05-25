import { useEffect, useRef } from 'react';
import { useChatStore } from '../../../api/store/chatStore';
import type { Message } from '../../../types';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageActions from './MessageActions';
import SourceBadge from './SourceBadge';
import ImageAttachment from './ImageAttachment';


interface MessageListProps {
  title: string;
}

export default function MessageList({ title }: MessageListProps) {
  const messages = useChatStore((s) => s.messages);
  const regenerateMessage = useChatStore((s) => s.regenerateMessage);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      <ChatHeader title={title} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 custom-scroll">
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
              <div key={msg.id}>
                <MessageBubble role="user" content={msg.content} />
                <MessageActions role="user" onCopy={() => handleCopy(msg.content)} />
              </div>
            );
          }

          const isStreaming = msg.status === 'streaming';
          return (
            <div key={msg.id}>
              <MessageBubble role="assistant" content={msg.content} isStreaming={isStreaming} />
              {!isStreaming && (
                <>
                  <MessageActions
                    role="assistant"
                    onCopy={() => handleCopy(msg.content)}
                    onRegenerate={() => regenerateMessage(msg.id)}
                  />
                  <SourceBadge sources={msg.sources} />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
    </div>
  );
}
