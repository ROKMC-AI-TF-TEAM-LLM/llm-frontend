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
  isLast: boolean;           // 맨 아래 어시스턴트 메시지인가(재생성 버튼 노출 대상)
  isStreaming: boolean;      // 전역 스트리밍 여부(재생성/다시시도 버튼 disabled 판단)
  statusText: string | null; // 이 행이 '스트리밍 중'일 때만 채워짐(그 외 항상 null → memo 유지)
  onCopy: (text: string) => void;      // 안정 참조(useCallback)
  onRegenerate: (id: string) => void;  // 안정 참조(Zustand action)
}

// 메시지 한 행. React.memo로 감싸 스트리밍 중 '안 바뀐 메시지'는 리렌더하지 않는다.
// (chatStore가 map에서 안 바뀐 항목을 `: m`로 참조 유지하므로 msg 참조가 안정적 → memo가 실제로 통과)
function MessageRowBase({ msg, isLast, isStreaming, statusText, onCopy, onRegenerate }: MessageRowProps) {
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
  const isInterrupted = msg.status === 'interrupted'; // 답변이 끊김(중단/세션이동/새로고침 모두)
  // 내용이 없는 중단 답변은 빈 말풍선을 숨기고 아래 배너만 보인다.
  const hideEmptyBubble = isInterrupted && msg.content.trim() === '';

  return (
    <div className="group/msg">
      {!hideEmptyBubble && (
        <MessageBubble
          role="assistant"
          content={msg.content}
          isStreaming={msgStreaming}
          statusText={msgStreaming ? statusText : undefined}
        />
      )}
      {!msgStreaming && (
        <>
          {/* 근거 부재 등 경고(notice) — 박스 없이 답변 아래 텍스트만 담백하게 표시한다. */}
          {msg.notice && (
            <p role="note" className="ml-1 mt-1 mb-2 text-[12.5px] leading-relaxed text-text-muted">
              {msg.notice.message}
            </p>
          )}
          {/* 출처 배지는 답변 바로 아래에 붙인다(액션바보다 위 → 답변과 떨어져 보이지 않게). */}
          <SourceBadge sources={msg.sources} />
          {/* 빈 채로 실패한 답변은 복사/재생성 액션바 대신 아래 배너의 '다시 시도'만 노출한다. */}
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
