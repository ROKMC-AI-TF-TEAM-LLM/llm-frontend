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
  const regenerateFromUser = useChatStore((s) => s.regenerateFromUser);
  const editAndResendMessage = useChatStore((s) => s.editAndResendMessage);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  const stickToBottom = useRef(true);
  const forceSmoothUntil = useRef(0);
  const [copyFailed, setCopyFailed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // 재생성/편집 시 새 응답이 맨 아래에서 스트리밍되므로 강제로 최하단까지 따라가되,
  // 직후 잠깐(700ms)은 부드럽게(smooth) 스크롤해 화면이 뚝 끊기지 않게 한다.
  const forceScrollBottom = () => {
    stickToBottom.current = true;
    forceSmoothUntil.current = Date.now() + 700;
  };

  const startEdit = (id: string, text: string) => { setEditingId(id); setEditText(text); };
  const saveEdit = (id: string) => {
    const text = editText.trim();
    if (!text) return;
    setEditingId(null);
    forceScrollBottom();
    editAndResendMessage(id, text);
  };

  useEffect(() => { isFirstLoad.current = true; stickToBottom.current = true; }, [title]);

  // ── 커스텀 오버레이 스크롤바 (네이티브는 숨기고 직접 그린 thumb) ──
  // 네이티브 ::-webkit-scrollbar는 transition이 안 먹어 페이드가 불가능하므로 실제 div로 대체.
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
    if (thumb.style.height !== '0px') thumb.style.opacity = '1';
    if (scrollHideTimer.current) clearTimeout(scrollHideTimer.current);
    scrollHideTimer.current = setTimeout(() => {
      if (!dragging.current && thumbRef.current) thumbRef.current.style.opacity = '0';
    }, 900);
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    showThumb();
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

  useEffect(() => {
    if (isLoading) return;
    const el = scrollRef.current;
    if (!el) return;
    if (!isFirstLoad.current && !stickToBottom.current) { positionThumb(); return; }
    const behavior = isFirstLoad.current
      ? 'instant'
      : Date.now() < forceSmoothUntil.current
        ? 'smooth'
        : isStreaming
          ? 'auto'
          : 'smooth';
    isFirstLoad.current = false;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior });
      positionThumb();
    });
  }, [messages, isLoading, isStreaming]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => setCopyFailed(true));
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      <ChatHeader title={title} />
      {copyFailed && <Toast message="복사에 실패했습니다." onClose={() => setCopyFailed(false)} />}

      <div className="relative flex-1 min-h-0">
      <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto px-4 py-6 scrollbar-hide" aria-live="polite" aria-atomic="false">
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
            if (editingId === msg.id) {
              return (
                <div key={msg.id} className="flex flex-col items-end gap-2 mb-4">
                  <textarea
                    autoFocus
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(msg.id); }
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    rows={Math.min(8, editText.split('\n').length + 1)}
                    className="w-full max-w-[75%] min-w-[260px] rounded-2xl border border-surface-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:border-brand resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-surface-border text-text-secondary hover:bg-surface-subtle transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => saveEdit(msg.id)}
                      disabled={!editText.trim()}
                      className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-brand text-white hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      보내기
                    </button>
                  </div>
                </div>
              );
            }
            return (
              <div key={msg.id} className="group/msg">
                <MessageBubble role="user" content={msg.content} />
                <MessageActions
                  role="user"
                  onCopy={() => handleCopy(msg.content)}
                  onEdit={isStreaming ? undefined : () => startEdit(msg.id, msg.content)}
                  onRegenerate={() => { forceScrollBottom(); regenerateFromUser(msg.id); }}
                  regenerateDisabled={isStreaming}
                  createdAt={msg.createdAt}
                />
              </div>
            );
          }

          const msgStreaming = msg.status === 'streaming';
          const isInterrupted = msg.status === 'interrupted';
          return (
            <div key={msg.id} className="group/msg">
              <MessageBubble role="assistant" content={msg.content} isStreaming={msgStreaming} />
              {!msgStreaming && (
                <>
                  <MessageActions
                    role="assistant"
                    onCopy={() => handleCopy(msg.content)}
                    onRegenerate={() => { forceScrollBottom(); regenerateMessage(msg.id); }}
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
                        onClick={() => { forceScrollBottom(); regenerateMessage(msg.id); }}
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
      </div>
        )}
    </div>
      <div
        ref={thumbRef}
        onMouseDown={onThumbMouseDown}
        style={{ height: 0 }}
        className="absolute top-0 right-1 w-1.5 rounded-full bg-brand/80 opacity-0 transition-opacity duration-500 cursor-pointer hover:bg-brand"
      />
      </div>
    </div>
  );
}
