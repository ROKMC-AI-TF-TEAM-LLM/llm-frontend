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
  const isStreaming = useChatStore((s) => s.isStreaming);
  const regenerateMessage = useChatStore((s) => s.regenerateMessage);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastUserRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  const anchored = useRef(false);
  const prevStreaming = useRef(false);
  const spacerHRef = useRef(0);
  const spacerRef = useRef<HTMLDivElement>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);

  // spacer 높이는 React 상태 대신 DOM에 직접 적용(스크롤 직전 즉시 반영되도록 — 타이밍 버그 방지)
  const setSpacer = (h: number) => {
    spacerHRef.current = h;
    if (spacerRef.current) spacerRef.current.style.height = `${h}px`;
  };

  useEffect(() => { isFirstLoad.current = true; anchored.current = false; setSpacer(0); }, [title]);

  const thumbRef = useRef<HTMLDivElement>(null);
  const scrollHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragging = useRef(false);

  const positionThumb = () => {
    const el = scrollRef.current;
    const thumb = thumbRef.current;
    if (!el || !thumb) return;
    const { scrollHeight, clientHeight, scrollTop } = el;
    if (scrollHeight <= clientHeight + 1) {
      thumb.style.height = '0px';
      thumb.style.opacity = '0';
      return;
    }
    const thumbH = Math.max((clientHeight / scrollHeight) * clientHeight, 32);
    const maxTop = clientHeight - thumbH;
    const top = (scrollTop / (scrollHeight - clientHeight)) * maxTop;
    thumb.style.height = `${thumbH}px`;
    thumb.style.transform = `translateY(${top}px)`;
  };

  const showThumb = () => {
    const thumb = thumbRef.current;
    if (!thumb) return;
    positionThumb();
    if (thumb.style.height !== '0px') {
      // 나올 땐 즉시(transition 없음), 들어갈 땐 페이드
      thumb.style.transition = 'none';
      thumb.style.opacity = '1';
    }
    if (scrollHideTimer.current) clearTimeout(scrollHideTimer.current);
    scrollHideTimer.current = setTimeout(() => {
      if (!dragging.current && thumbRef.current) {
        thumbRef.current.style.transition = 'opacity 0.5s ease';
        thumbRef.current.style.opacity = '0';
      }
    }, 900);
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    // 실제 컨텐츠 끝(spacer 제외) 기준으로 '맨 아래' 판단
    const realBottom = el.scrollHeight - spacerHRef.current;
    setShowScrollDown(realBottom - (el.scrollTop + el.clientHeight) > 160);
    showThumb();
  };

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollDown(false);
    const realBottom = el.scrollHeight - spacerHRef.current;
    el.scrollTo({ top: Math.max(0, realBottom - el.clientHeight), behavior: 'smooth' });
  };

  const onThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = scrollRef.current;
    const thumb = thumbRef.current;
    if (!el || !thumb) return;
    dragging.current = true;
    const startY = e.clientY;
    const startScroll = el.scrollTop;
    const thumbH = thumb.offsetHeight;
    const maxTop = el.clientHeight - thumbH;
    const scrollPerPx = maxTop > 0 ? (el.scrollHeight - el.clientHeight) / maxTop : 0;
    document.body.style.userSelect = 'none';
    const onMove = (ev: MouseEvent) => {
      el.scrollTop = startScroll + (ev.clientY - startY) * scrollPerPx;
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      showThumb();
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // 세션 로드 시: 최신(맨 아래) 표시
  useEffect(() => {
    if (isLoading) return;
    const el = scrollRef.current;
    if (!el) return;
    if (isFirstLoad.current && messages.length > 0 && !isStreaming) {
      isFirstLoad.current = false;
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: 'instant' });
        positionThumb();
      });
    }
  }, [messages, isLoading, isStreaming]);

  // 전송 시: 새 질문을 화면 위로 올리고, 아래는 '딱 한 화면'만 차도록 공간 확보(그 이상 빈 공간 X).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const justStarted = isStreaming && !prevStreaming.current;
    prevStreaming.current = isStreaming;
    if (justStarted) { isFirstLoad.current = false; anchored.current = true; }

    const userEl = lastUserRef.current;
    if (!anchored.current || !userEl) return;

    // 핀 위치(질문이 상단 GAP)가 곧 스크롤 '맨 아래'가 되도록 spacer 계산.
    // → 핀 상태에서 더 이상 아래로 스크롤되지 않고, 남는 빈 공간도 없음.
    const GAP = 8;
    const contentBelow = (el.scrollHeight - spacerHRef.current) - userEl.offsetTop;
    setSpacer(Math.max(0, el.clientHeight - contentBelow - GAP));

    if (justStarted) {
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight - el.clientHeight, behavior: 'smooth' });
        positionThumb();
      });
    } else {
      requestAnimationFrame(positionThumb);
    }
  }, [messages, isStreaming]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => setCopyFailed(true));
  };

  let lastUserId: string | null = null;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user' && messages[i].type === 'text') { lastUserId = messages[i].id; break; }
  }

  // 재생성 버튼은 '맨 아래' 어시스턴트 메시지에만 노출한다.
  let lastAssistantId: string | null = null;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant' && messages[i].type === 'text') { lastAssistantId = messages[i].id; break; }
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      <ChatHeader title={title} />
      {copyFailed && <Toast message="복사에 실패했습니다." onClose={() => setCopyFailed(false)} />}

      <div className="relative flex-1 min-h-0">
      <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto px-4 pt-6 pb-40 scrollbar-hide" aria-live="polite" aria-atomic="false">
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
              <div key={msg.id} ref={msg.id === lastUserId ? lastUserRef : undefined} className="group/msg">
                <MessageBubble role="user" content={msg.content} />
                <MessageActions
                  role="user"
                  onCopy={() => handleCopy(msg.content)}
                  createdAt={msg.createdAt}
                />
              </div>
            );
          }

          const msgStreaming = msg.status === 'streaming';
          const isInterrupted = msg.status === 'interrupted';
          const isLastAssistant = msg.id === lastAssistantId;
          return (
            <div key={msg.id} className="group/msg">
              <MessageBubble role="assistant" content={msg.content} isStreaming={msgStreaming} />
              {!msgStreaming && (
                <>
                  <MessageActions
                    role="assistant"
                    onCopy={() => handleCopy(msg.content)}
                    onRegenerate={isLastAssistant ? () => regenerateMessage(msg.id) : undefined}
                    regenerateDisabled={isStreaming}
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
                        disabled={isStreaming}
                        className="ml-auto px-3 py-1 rounded-lg border border-surface-border bg-surface text-sm text-text-primary hover:bg-surface-subtle transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface"
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
        <div ref={spacerRef} style={{ height: 0 }} aria-hidden />
      </div>
        )}
    </div>
      <div
        ref={thumbRef}
        onMouseDown={onThumbMouseDown}
        style={{ height: 0, opacity: 0 }}
        className="absolute top-0 right-1 w-1.5 rounded-full bg-text-muted/80 cursor-pointer hover:bg-text-muted"
      />
      {showScrollDown && (
        <button
          type="button"
          onClick={scrollToBottom}
          aria-label="맨 아래로"
          className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-surface border border-surface-border shadow-md text-text-secondary hover:bg-surface-subtle transition-colors animate-fade-in"
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </button>
      )}
      </div>
    </div>
  );
}
