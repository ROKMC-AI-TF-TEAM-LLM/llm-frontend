import type { ReactNode } from 'react';
import type { MessageRole } from '../../../types';

interface MessageBubbleProps {
  role?: MessageRole;
  children: ReactNode;
}

export default function MessageBubble({ role = 'assistant', children }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-1`}>
      {!isUser && (
        <div className="shrink-0 mr-3 mt-1">
          <div className="w-7 h-7 rounded-full border-2 border-surface-border bg-surface" />
        </div>
      )}
      <div
        className={`
          max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed wrap-break-word whitespace-pre-wrap
          ${isUser
            ? 'bg-brand text-white rounded-tr-sm'
            : 'bg-surface-subtle text-text-primary rounded-tl-sm'}
        `}
      >
        {children}
      </div>
    </div>
  );
}