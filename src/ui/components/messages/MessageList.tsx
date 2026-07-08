import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useChatStore } from '../../../api/store/chatStore';
import { logError } from '../../../utils/logError';
import { copyText } from '../../../utils/clipboard';
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
  const statusText = useChatStore((s) => s.statusText);
  const sessionId = useChatStore((s) => s.sessionId);
  const regenerateMessage = useChatStore((s) => s.regenerateMessage);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  const anchored = useRef(false);
  const anchoredIdRef = useRef<string | null>(null);
  const spacerHRef = useRef(0);
  const spacerRef = useRef<HTMLDivElement>(null);
  const scrollAnimRef = useRef(0);
  const [copyFailed, setCopyFailed] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);

  // spacer 높이는 React 상태 대신 DOM에 직접 적용(스크롤 직전 즉시 반영되도록 — 타이밍 버그 방지)
  const setSpacer = (h: number) => {
    spacerHRef.current = h;
    if (spacerRef.current) spacerRef.current.style.height = `${h}px`;
  };

  // 부드러운 앵커 스크롤: 목표를 매 프레임 getTarget()으로 재계산해 이동. native smooth와 달리 스트리밍 중
  // 레이아웃 변화(빈 답변→답변, spacer 재계산)에도 취소되지 않고 목표에 정확히 안착한다.
  const animateAnchor = (el: HTMLDivElement, getTarget: () => number, duration = 340) => {
    cancelAnimationFrame(scrollAnimRef.current);
    const startTop = el.scrollTop;
    const target0 = getTarget();
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || Math.abs(target0 - startTop) < 2) { el.scrollTop = target0; return; }
    const t0 = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic
    const step = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      el.scrollTop = startTop + (getTarget() - startTop) * ease(p);
      if (p < 1) scrollAnimRef.current = requestAnimationFrame(step);
    };
    scrollAnimRef.current = requestAnimationFrame(step);
  };

  // 세션 진입 시에만 리셋. (title은 첫 메시지 후 비동기로 확정되므로, title에 걸면 대화 도중 리셋되어
  // first-load '맨 아래로' 스크롤이 오작동 → 2번째 질문이 상단 고정에 실패하던 버그의 원인이었음)
  useEffect(() => { isFirstLoad.current = true; anchored.current = false; anchoredIdRef.current = null; setSpacer(0); }, [sessionId]);

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

  // 세션 로드 시: 최신(맨 아래) 표시 — paint 전(useLayoutEffect)에 스크롤해 '맨 위 깜빡' 방지
  useLayoutEffect(() => {
    if (isLoading) return;
    const el = scrollRef.current;
    if (!el) return;
    if (isFirstLoad.current && messages.length > 0 && !isStreaming) {
      isFirstLoad.current = false;
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      positionThumb();
    }
  }, [messages, isLoading, isStreaming]);

  // 전송 시: 새 질문을 화면 위로 올리고, 아래는 '딱 한 화면'만 차도록 공간 확보(그 이상 빈 공간 X).
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // 앵커 대상 질문 id: 스트리밍 중 답변 바로 앞의 user 질문(없으면 마지막 user). DOM에서 data-mid로 직접 조회.
    const sIdx = messages.findIndex((m) => m.type === 'text' && m.role === 'assistant' && m.status === 'streaming');
    const from = sIdx === -1 ? messages.length - 1 : sIdx - 1;
    let anchorId: string | null = null;
    for (let i = from; i >= 0; i--) {
      if (messages[i].role === 'user' && messages[i].type === 'text') { anchorId = messages[i].id; break; }
    }
    const escId = anchorId ? (window.CSS?.escape ? window.CSS.escape(anchorId) : anchorId) : null;
    const userEl = escId ? el.querySelector<HTMLElement>(`[data-mid="${escId}"]`) : null;

    // '새 질문(스트리밍 시작)'을 id로 판단 → justStarted 같은 1회성 엣지 트리거에 의존하지 않는다.
    // 스크롤할 순간에 DOM 요소가 아직 없으면(요소 미부착) 앵커 완료 표시를 하지 않고 return → 다음 렌더에서 재시도.
    const isNewQuestion = sIdx !== -1 && anchorId !== null && anchorId !== anchoredIdRef.current;

    if (!userEl) return;
    if (!isNewQuestion && !anchored.current) return;
    if (isNewQuestion) { isFirstLoad.current = false; anchored.current = true; }

    // spacer 계산: realContent(=spacer 제외 실제 콘텐츠 높이)를 '실측'한다. spacer를 잠깐 0으로 만든 뒤
    // scrollHeight를 읽으면(리플로우) 정확히 잴 수 있다. 추적 ref/offsetHeight는 세션 리셋·언마운트 등으로
    // 실제 DOM과 어긋나 spacer가 과소 계산(→maxScroll이 목표보다 작아 clamp)되던 게 근본 원인이었다.
    const GAP = 8;
    const qDocPos = el.scrollTop + userEl.getBoundingClientRect().top - el.getBoundingClientRect().top; // 질문의 문서상 위치(스크롤 무관)
    const savedTop = el.scrollTop;
    // 실제 콘텐츠 높이 측정: spacer를 0으로 두면 콘텐츠가 뷰포트보다 짧을 때 scrollHeight가 clientHeight로
    // '바닥(floor)'에 걸려 과대측정된다. 그래서 반대로 충분히 큰 spacer를 넣어 floor를 피한 뒤 빼서 잰다.
    const PROBE = el.clientHeight;
    setSpacer(PROBE);
    const realContent = el.scrollHeight - PROBE; // floor 회피 → 정확한 실제 콘텐츠 높이(패딩 포함)
    const contentBelow = realContent - qDocPos;
    setSpacer(Math.max(0, el.clientHeight - contentBelow - GAP));
    if (el.scrollTop !== savedTop) el.scrollTop = savedTop; // setSpacer(0)로 클램프된 스크롤 복원

    // 새 질문을 상단(GAP)으로 부드럽게 고정. spacer가 maxScroll = qDocPos-GAP 이 되도록 맞춰져 목표까지 도달 가능.
    if (isNewQuestion) {
      // eslint-disable-next-line no-console
      console.log('[X]', 'sIdx', sIdx, '| qDocPos', Math.round(qDocPos), '| maxScroll', el.scrollHeight - el.clientHeight, '| realContent', realContent, '| contentBelow', Math.round(contentBelow), '| ch', el.clientHeight, '| sh', el.scrollHeight);
      anchoredIdRef.current = anchorId;
      animateAnchor(el, () =>
        Math.max(0, el.scrollTop + userEl.getBoundingClientRect().top - el.getBoundingClientRect().top - GAP)
      );
    }
    positionThumb();
  }, [messages, isStreaming]);

  const handleCopy = (text: string) => {
    copyText(text).catch((e) => { logError('MessageList.copy', e); setCopyFailed(true); });
  };

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
      <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto px-4 pt-6 pb-40 scrollbar-hide [overflow-anchor:none]" aria-live="polite" aria-atomic="false">
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
              <div key={msg.id} data-mid={msg.id} className="group/msg">
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
              <MessageBubble role="assistant" content={msg.content} isStreaming={msgStreaming} statusText={msgStreaming ? statusText : undefined} />
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
                    <div className="flex items-center gap-3 ml-1 mb-3 px-4 py-2.5 rounded-xl border border-surface-border bg-surface-subtle text-sm text-text-secondary">
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
