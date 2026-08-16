import { memo } from 'react';
import type { Message } from '../../../types';
import MessageBubble from './MessageBubble';
import MessageActions from './MessageActions';
import SourceBadge from './SourceBadge';
import FileDownload from './FileDownload';
import ImageAttachment from './ImageAttachment';
import DomainIcon from '../chat/DomainIcon';

interface MessageRowProps {
  msg: Message;
  isLast: boolean;
  isStreaming: boolean;
  statusText: string | null;
  statusSteps?: string[];
  onCopy: (text: string) => void;
  onRegenerate: (id: string) => void;
}

function MessageRowBase({ msg, isLast, isStreaming, statusText, statusSteps, onCopy, onRegenerate }: MessageRowProps) {
  if (msg.type === 'image') {
    return <ImageAttachment filename={msg.filename} caption={msg.caption} />;
  }

  if (msg.role === 'user') {
    return (
      <div data-mid={msg.id} className="group/msg">
        {msg.domainLabel && msg.domainCode && (
          <div className="flex justify-end mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-subtle text-brand text-[12px] font-medium border border-brand-soft">
              <DomainIcon code={msg.domainCode} size={13} />
              {msg.domainLabel}
            </span>
          </div>
        )}
        <MessageBubble role="user" content={msg.content} />
        <MessageActions role="user" onCopy={() => onCopy(msg.content)} createdAt={msg.createdAt} />
      </div>
    );
  }

  const msgStreaming = msg.status === 'streaming';
  const isInterrupted = msg.status === 'interrupted';
  const hideEmptyBubble = isInterrupted && msg.content.trim() === '';

  return (
    <div className="group/msg">
      {!hideEmptyBubble && (
        <MessageBubble
          role="assistant"
          content={msg.content}
          isStreaming={msgStreaming}
          statusText={msgStreaming ? statusText : undefined}
          statusSteps={msgStreaming ? statusSteps : undefined}
        />
      )}
      {!msgStreaming && (
        <>
          <SourceBadge sources={msg.sources} notice={msg.notice} />
          {!hideEmptyBubble && (
            <MessageActions
              role="assistant"
              onCopy={() => onCopy(msg.content)}
              onRegenerate={isLast ? () => onRegenerate(msg.id) : undefined}
              regenerateDisabled={isStreaming}
              createdAt={msg.createdAt}
            />
          )}
          {isInterrupted && (
            <div className="flex items-center gap-3 ml-1 mb-3 px-4 py-2.5 rounded-xl border border-surface-border bg-surface-subtle text-sm text-text-secondary">
              <svg className="w-4 h-4 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
              </svg>
              <span>응답이 중단되었습니다.</span>
              <button
                onClick={() => onRegenerate(msg.id)}
                disabled={isStreaming}
                className="ml-auto px-3 py-1 rounded-lg border border-surface-border bg-surface text-sm text-text-primary hover:bg-surface-subtle transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface"
              >
                다시 시도
              </button>
            </div>
          )}
          <FileDownload attachments={msg.attachments} />
        </>
      )}
    </div>
  );
}

const MessageRow = memo(MessageRowBase);
export default MessageRow;
