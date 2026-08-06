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
  /** 상단 ChatHeader를 숨긴다. 프로젝트 화면처럼 바깥에 이미 헤더가 있을 때 중복을 막는다. */
  hideHeader?: boolean;
}

export default function MessageList({ title, isLoading, hideHeader = false }: MessageListProps) {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const statusText = useChatStore((s) => s.statusText);
  const sessionId = useChatStore((s) => s.sessionId);
  const regenerateMessage = useChatStore((s) => s.regenerateMessage);
  const hasMore = useChatStore((s) => s.hasMore);
  const isLoadingMore = useChatStore((s) => s.isLoadingMore);
  const loadMoreMessages = useChatStore((s) => s.loadMoreMessages);
  // 과거 페이지 prepend 시 스크롤이 위로 튀지 않게, 로드 직전 높이를 기억해 위치를 보정한다.
  const restoreScrollRef = useRef<number | null>(null);
  // prepend(과거 로드) 진행 중 표시. true인 동안엔 진입/전송 앵커 effect가 스크롤을 건드리지 않는다
  // (여러 useLayoutEffect가 같은 [messages]에 반응해 scrollTop을 서로 덮어써 '끊김·중간 정지'가 생겼음).
  const prependingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  // 사용자가 첫 로드 자동 스크롤 전에 직접 스크롤하면, 하단 앵커를 포기한다(도로 내려가는 것 방지).
  const userScrolledBeforeAnchor = useRef(false);
  const anchored = useRef(false);
  const anchoredIdRef = useRef<string | null>(null);
  // 이번에 앵커를 건 '스트리밍 assistant id'. 재생성은 질문 id가 그대로라 질문 id로는
  // 새 스트림을 구분 못 한다 → 스트리밍 중 assistant id 기준으로 앵커 여부를 판단한다.
  const anchoredStreamIdRef = useRef<string | null>(null);
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
  useEffect(() => { isFirstLoad.current = true; userScrolledBeforeAnchor.current = false; anchored.current = false; anchoredIdRef.current = null; anchoredStreamIdRef.current = null; setSpacer(0); }, [sessionId]);

  // 스트림 시작 엣지 감지: 어떤 assistant가 '스트리밍 아님 → 스트리밍'으로 바뀌면(새 질문이든 재생성이든)
  // 이번 스트림은 아직 앵커 전이므로 anchoredStreamIdRef를 리셋한다.
  // (재생성은 같은 assistant id를 재사용해 id 비교만으로는 새 스트림을 구분 못 하는 문제를 해결)
  const wasStreamingRef = useRef(false);
  useEffect(() => {
    const isStreamingNow = messages.some((m) => m.type === 'text' && m.role === 'assistant' && m.status === 'streaming');
    if (isStreamingNow && !wasStreamingRef.current) {
      anchoredStreamIdRef.current = null; // 새 스트림 → 앵커 다시 걸리도록
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
    // 첫 로드 하단 앵커가 끝나기 전에 사용자가 직접 스크롤하면, 자동 하단 이동을 포기한다.
    if (isFirstLoad.current) userScrolledBeforeAnchor.current = true;
    // 맨 위 근처(120px)에 닿으면 과거 메시지 한 페이지를 로드. 첫 로드 앵커 중엔 막는다.
    // prependingRef까지 확인해, 로딩 시작~완료 사이의 스크롤 이벤트가 중복 요청/중복 보정을 내는 것을 막는다.
    if (!isFirstLoad.current && !prependingRef.current && el.scrollTop < 120 && hasMore && !isLoadingMore) {
      // prepend 후 위치 복원용으로 '바닥에서부터의 거리(scrollHeight-scrollTop)'를 기억.
      restoreScrollRef.current = el.scrollHeight - el.scrollTop;
      prependingRef.current = true; // 이 messages 갱신은 prepend임을 앵커 effect들에 알린다
      loadMoreMessages();
    }
    // 실제 컨텐츠 끝(spacer 제외) 기준으로 '맨 아래' 판단
    const realBottom = el.scrollHeight - spacerHRef.current;
    setShowScrollDown(realBottom - (el.scrollTop + el.clientHeight) > 160);
    showThumb();
  };

  // 과거 페이지가 앞에 붙으면 콘텐츠가 위로 밀려 스크롤이 튄다. 로드 직전 기억해둔 '바닥에서부터의
  // 거리'를 그대로 복원해 사용자가 보던 위치를 유지한다. paint 전(useLayoutEffect)에 보정 → 깜빡임 없음.
  // 다른 앵커 effect보다 먼저 선언해 이 useLayoutEffect가 먼저 실행되게 한다(스크롤 소유권 우선).
  useLayoutEffect(() => {
    if (restoreScrollRef.current == null) return;
    const el = scrollRef.current;
    if (!el) { restoreScrollRef.current = null; prependingRef.current = false; return; }
    el.scrollTop = el.scrollHeight - restoreScrollRef.current;
    restoreScrollRef.current = null;
    prependingRef.current = false; // 보정 끝 → 이후 앵커 effect 정상화
  }, [messages]);

  // 첫 페이지가 화면을 다 못 채우면 스크롤이 안 생겨 위로 스크롤 트리거가 불가능하다.
  // 그럴 때 화면이 찰 때까지(또는 hasMore 소진까지) 자동으로 과거 페이지를 당겨온다.
  // 첫 진입 하단 앵커가 끝난 뒤에만(isFirstLoad=false) 동작해 앵커와 경쟁하지 않게 한다.
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

  // 세션 로드 시: 최신(맨 아래) 표시 — paint 전(useLayoutEffect)에 스크롤해 '맨 위 깜빡' 방지
  useLayoutEffect(() => {
    if (isLoading || prependingRef.current) return; // 과거 로드 중엔 위치 보정에 양보
    const el = scrollRef.current;
    if (!el) return;
    if (isFirstLoad.current && messages.length > 0 && !isStreaming) {
      // 사용자가 그 사이 위로 스크롤했다면 강제로 내리지 않는다.
      if (!userScrolledBeforeAnchor.current) {
        // 이전 세션의 전송 앵커가 남긴 spacer가 남아 scrollHeight를 부풀리면 위치가 어긋난다.
        // spacer를 0으로 리셋한 뒤 실제 바닥으로 내린다.
        setSpacer(0);
        el.scrollTop = el.scrollHeight;
      }
      // 앵커 완료 표시는 실제로 바닥에 놓은 '다음 프레임'에 한다(scrollTop 반영 전 handleScroll 오발동 방지).
      requestAnimationFrame(() => { isFirstLoad.current = false; });
      positionThumb();
    }
  }, [messages, isLoading, isStreaming]);

  // 전송 시: 새 질문을 화면 위로 올리고, 아래는 '딱 한 화면'만 차도록 공간 확보(그 이상 빈 공간 X).
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (prependingRef.current) return; // 과거 로드로 인한 messages 변경엔 전송 앵커가 개입하지 않는다
    // 세션 진입 중(아직 하단 앵커 전)엔 이 effect의 spacer 조작이 진입 앵커와 충돌해 '아래로 확 튄다'.
    // 새 질문 스트리밍이 아니면(=단순 진입) 개입하지 않는다.
    const isStreamingNow = messages.some((m) => m.type === 'text' && m.role === 'assistant' && m.status === 'streaming');
    if (isFirstLoad.current && !isStreamingNow) return;

    // 앵커 대상 질문 id: 스트리밍 중 답변 바로 앞의 user 질문(없으면 마지막 user). DOM에서 data-mid로 직접 조회.
    const sIdx = messages.findIndex((m) => m.type === 'text' && m.role === 'assistant' && m.status === 'streaming');
    const streamingId = sIdx !== -1 ? messages[sIdx].id : null;
    const from = sIdx === -1 ? messages.length - 1 : sIdx - 1;
    let anchorId: string | null = null;
    for (let i = from; i >= 0; i--) {
      if (messages[i].role === 'user' && messages[i].type === 'text') { anchorId = messages[i].id; break; }
    }
    const escId = anchorId ? (window.CSS?.escape ? window.CSS.escape(anchorId) : anchorId) : null;
    const userEl = escId ? el.querySelector<HTMLElement>(`[data-mid="${escId}"]`) : null;

    // '새 스트림 시작'을 스트리밍 assistant id로 판단한다. 재생성(서버 경로)은 같은 assistant id를
    // 재사용하지만 매번 done→streaming으로 전환되므로, 그 사이 anchoredStreamIdRef를 null로 리셋해
    // 같은 질문을 다시 재생성해도 앵커가 걸리게 한다(아래 별도 effect).
    // 스크롤할 순간에 DOM 요소가 아직 없으면(요소 미부착) 앵커 완료 표시를 하지 않고 return → 다음 렌더에서 재시도.
    const isNewQuestion = sIdx !== -1 && anchorId !== null && streamingId !== anchoredStreamIdRef.current;

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
      anchoredIdRef.current = anchorId;
      anchoredStreamIdRef.current = streamingId;
      animateAnchor(el, () =>
        Math.max(0, el.scrollTop + userEl.getBoundingClientRect().top - el.getBoundingClientRect().top - GAP)
      );
    }
    positionThumb();
  }, [messages, isStreaming]);

  // MessageRow가 memo이므로 콜백은 안정 참조여야 memo가 유지된다(매 렌더 새 함수 X).
  const handleCopy = useCallback((text: string) => {
    copyText(text).catch((e) => { logError('MessageList.copy', e); setCopyFailed(true); });
  }, []);

  // 재생성 버튼은 '맨 아래' 어시스턴트 메시지에만 노출한다.
  let lastAssistantId: string | null = null;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant' && messages[i].type === 'text') { lastAssistantId = messages[i].id; break; }
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      {!hideHeader && <ChatHeader title={title} />}
      {copyFailed && <Toast message="복사에 실패했습니다." onClose={() => setCopyFailed(false)} />}

      <div className="relative flex-1 min-h-0">
      <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto px-4 pt-6 pb-2 scrollbar-hide [overflow-anchor:none]" aria-live="polite" aria-atomic="false">
        {isLoading ? (
          <MessagesSkeleton />
        ) : (
        // 로딩 → 목록 전환을 페이드로(팍 튀지 않게). 하단 앵커는 paint 전에 끝나므로 최하단부터 부드럽게 나타난다.
        <div className="max-w-3xl mx-auto animate-fade-in">
        {/* 과거 메시지 로딩 스피너 — 높이 고정(h-9) 컨테이너로 감싸, 로딩 전후 레이아웃 점프를 없앤다.
            (스피너가 나타났다 사라지며 높이가 바뀌면 prepend 위치 보정이 그만큼 어긋나 끊긴다) */}
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
            // 스트리밍 중인 행에만 statusText 전달 → 그 외 행은 항상 null이라 memo 유지
            statusText={msg.role === 'assistant' && msg.type === 'text' && msg.status === 'streaming' ? statusText : null}
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
