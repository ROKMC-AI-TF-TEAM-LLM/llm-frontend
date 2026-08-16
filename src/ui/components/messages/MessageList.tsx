import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useChatStore } from '../../../api/store/chatStore';
import { logError } from '../../../utils/logError';
import { copyText } from '../../../utils/clipboard';
import Toast from '../Toast';
import type { Message } from '../../../types';
import ChatHeader from './ChatHeader';
import MessageRow from './MessageRow';
import { MessagesSkeleton } from '../Skeleton';

interface MessageListProps {
  title: string;
  isLoading?: boolean;
  hideHeader?: boolean;
}

export default function MessageList({ title, isLoading, hideHeader = false }: MessageListProps) {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const statusText = useChatStore((s) => s.statusText);
  const statusSteps = useChatStore((s) => s.statusSteps);
  const sessionId = useChatStore((s) => s.sessionId);
  const regenerateMessage = useChatStore((s) => s.regenerateMessage);
  const hasMore = useChatStore((s) => s.hasMore);
  const isLoadingMore = useChatStore((s) => s.isLoadingMore);
  const loadMoreMessages = useChatStore((s) => s.loadMoreMessages);
  const restoreScrollRef = useRef<number | null>(null);
  const prependingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  const userScrolledBeforeAnchor = useRef(false);
  const anchored = useRef(false);
  const anchoredIdRef = useRef<string | null>(null);
  const anchoredStreamIdRef = useRef<string | null>(null);
  const spacerHRef = useRef(0);
  const spacerRef = useRef<HTMLDivElement>(null);
  const scrollAnimRef = useRef(0);
  const [copyFailed, setCopyFailed] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const setSpacer = (h: number) => {
    spacerHRef.current = h;
    if (spacerRef.current) spacerRef.current.style.height = `${h}px`;
  };

  const animateAnchor = (el: HTMLDivElement, getTarget: () => number, duration = 340) => {
    cancelAnimationFrame(scrollAnimRef.current);
    const startTop = el.scrollTop;
    const target0 = getTarget();
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || Math.abs(target0 - startTop) < 2) { el.scrollTop = target0; return; }
    const t0 = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      el.scrollTop = startTop + (getTarget() - startTop) * ease(p);
      if (p < 1) scrollAnimRef.current = requestAnimationFrame(step);
    };
    scrollAnimRef.current = requestAnimationFrame(step);
  };

  useEffect(() => { isFirstLoad.current = true; userScrolledBeforeAnchor.current = false; anchored.current = false; anchoredIdRef.current = null; anchoredStreamIdRef.current = null; setSpacer(0); }, [sessionId]);

  const wasStreamingRef = useRef(false);
  useEffect(() => {
    const isStreamingNow = messages.some((m) => m.type === 'text' && m.role === 'assistant' && m.status === 'streaming');
    if (isStreamingNow && !wasStreamingRef.current) {
      anchoredStreamIdRef.current = null;
    }
    wasStreamingRef.current = isStreamingNow;
  }, [messages]);

  useEffect(() => () => cancelAnimationFrame(scrollAnimRef.current), []);

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
    if (isFirstLoad.current) userScrolledBeforeAnchor.current = true;
    if (!isFirstLoad.current && !prependingRef.current && el.scrollTop < 120 && hasMore && !isLoadingMore) {
      restoreScrollRef.current = el.scrollHeight - el.scrollTop;
      prependingRef.current = true;
      loadMoreMessages();
    }
    const realBottom = el.scrollHeight - spacerHRef.current;
    setShowScrollDown(realBottom - (el.scrollTop + el.clientHeight) > 160);
    showThumb();
  };

  useLayoutEffect(() => {
    if (restoreScrollRef.current == null) return;
    const el = scrollRef.current;
    if (!el) { restoreScrollRef.current = null; prependingRef.current = false; return; }
    el.scrollTop = el.scrollHeight - restoreScrollRef.current;
    restoreScrollRef.current = null;
    prependingRef.current = false;
  }, [messages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isLoading || isFirstLoad.current || prependingRef.current) return;
    const noScrollbar = el.scrollHeight <= el.clientHeight + 8;
    if (noScrollbar && hasMore && !isLoadingMore) {
      restoreScrollRef.current = el.scrollHeight - el.scrollTop;
      prependingRef.current = true;
      loadMoreMessages();
    }
  }, [messages, isLoading, hasMore, isLoadingMore, loadMoreMessages]);

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

  useLayoutEffect(() => {
    if (isLoading || prependingRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    if (isFirstLoad.current && messages.length > 0 && !isStreaming) {
      if (!userScrolledBeforeAnchor.current) {
        setSpacer(0);
        el.scrollTop = el.scrollHeight;
      }
      requestAnimationFrame(() => { isFirstLoad.current = false; });
      positionThumb();
    }
  }, [messages, isLoading, isStreaming]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (prependingRef.current) return;
    const isStreamingNow = messages.some((m) => m.type === 'text' && m.role === 'assistant' && m.status === 'streaming');
    if (isFirstLoad.current && !isStreamingNow) return;

    const sIdx = messages.findIndex((m) => m.type === 'text' && m.role === 'assistant' && m.status === 'streaming');
    const streamingId = sIdx !== -1 ? messages[sIdx].id : null;
    const from = sIdx === -1 ? messages.length - 1 : sIdx - 1;
    let anchorId: string | null = null;
    for (let i = from; i >= 0; i--) {
      if (messages[i].role === 'user' && messages[i].type === 'text') { anchorId = messages[i].id; break; }
    }
    const escId = anchorId ? (window.CSS?.escape ? window.CSS.escape(anchorId) : anchorId) : null;
    const userEl = escId ? el.querySelector<HTMLElement>(`[data-mid="${escId}"]`) : null;

    const isNewQuestion = sIdx !== -1 && anchorId !== null && streamingId !== anchoredStreamIdRef.current;

    if (!userEl) return;
    if (!isNewQuestion && !anchored.current) return;
    if (isNewQuestion) { isFirstLoad.current = false; anchored.current = true; }

    const GAP = 8;
    const qDocPos = el.scrollTop + userEl.getBoundingClientRect().top - el.getBoundingClientRect().top;
    const savedTop = el.scrollTop;
    const PROBE = el.clientHeight;
    setSpacer(PROBE);
    const realContent = el.scrollHeight - PROBE;
    const contentBelow = realContent - qDocPos;
    setSpacer(Math.max(0, el.clientHeight - contentBelow - GAP));
    if (el.scrollTop !== savedTop) el.scrollTop = savedTop;

    if (isNewQuestion) {
      anchoredIdRef.current = anchorId;
      anchoredStreamIdRef.current = streamingId;
      animateAnchor(el, () =>
        Math.max(0, el.scrollTop + userEl.getBoundingClientRect().top - el.getBoundingClientRect().top - GAP)
      );
    }
    positionThumb();
  }, [messages, isStreaming]);

  const handleCopy = useCallback((text: string) => {
    copyText(text).catch((e) => { logError('MessageList.copy', e); setCopyFailed(true); });
  }, []);

  let lastAssistantId: string | null = null;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant' && messages[i].type === 'text') { lastAssistantId = messages[i].id; break; }
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      {!hideHeader && <ChatHeader title={title} />}
      {copyFailed && <Toast message="복사에 실패했습니다." onClose={() => setCopyFailed(false)} />}

      <div className="relative flex-1 min-h-0">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-3"
        style={{ background: 'linear-gradient(to bottom, var(--color-surface) 40%, rgba(255,255,255,0) 100%)' }}
      />
      <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto px-4 pt-6 pb-2 scrollbar-hide [overflow-anchor:none]" aria-live="polite" aria-atomic="false">
        {isLoading ? (
          <MessagesSkeleton />
        ) : (
        <div className="max-w-3xl mx-auto animate-fade-in">
        {hasMore && (
          <div className="flex justify-center items-center h-9">
            {isLoadingMore && (
              <span className="w-5 h-5 rounded-full border-2 border-surface-border border-t-brand animate-spin" />
            )}
          </div>
        )}
        {messages.map((msg: Message) => (
          <MessageRow
            key={msg.id}
            msg={msg}
            isLast={msg.id === lastAssistantId}
            isStreaming={isStreaming}
            statusText={msg.role === 'assistant' && msg.type === 'text' && msg.status === 'streaming' ? statusText : null}
            statusSteps={msg.role === 'assistant' && msg.type === 'text' && msg.status === 'streaming' ? statusSteps : undefined}
            onCopy={handleCopy}
            onRegenerate={regenerateMessage}
          />
        ))}
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
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-surface border border-surface-border shadow-md text-text-secondary hover:bg-surface-subtle transition-colors animate-fade-in"
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
