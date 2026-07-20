import { Streamdown } from 'streamdown';
import type { Components } from 'streamdown';
import type { MessageRole } from '../../../types';

// 볼드 보정: 내부 공백 정리 + 단어에 붙은 닫는 ** 뒤(또는 여는 ** 앞)에 공백을 넣어
// `...)**와` 처럼 한글에 붙어 인식 안 되던 볼드를 살린다. (스트리밍 중에도 안전 — 글자 출렁임 없음)
const fixBold = (content: string): string =>
  content
    .replace(/\*\*[ \t]*(\S(?:[^*\n]*?\S)?)[ \t]*\*\*/g, '**$1**')
    .replace(/\*\*([^*\n]+?)\*\*/g, (match: string, inner: string, offset: number, full: string) => {
      const prev = full[offset - 1];
      const next = full[offset + match.length];
      const isWord = (c: string | undefined) => !!c && /[가-힣A-Za-z0-9]/.test(c);
      const isPunct = (c: string | undefined) => !!c && /[^\s\w가-힣]/.test(c);
      const lead = isWord(prev) && isPunct(inner[0]) ? ' ' : '';
      const trail = isWord(next) && isPunct(inner[inner.length - 1]) ? ' ' : '';
      return `${lead}**${inner}**${trail}`;
    });

const normalizeMarkdown = (content: string): string =>
  fixBold(content)
    .replace(/([^\n])\n(#{1,6} )/g, '$1\n\n$2')
    .replace(/^[•·–—]\s*/gm, '- ')
    .replace(/([가-힣]) +(을|를|에|에서|은|는|이|가|으로|로|와|과)(?=[\s,.?!]|$)/gm, '$1$2');

// 스트리밍 표시용: 미완성 토큰 처리는 streamdown(mode="streaming", parseIncompleteMarkdown)에 맡기고,
// 한글에 붙은 볼드(`...)**에`)만 보정한다. (불릿 `*`까지 건드리던 수동 보정은 제거)
const streamMarkdown = (content: string): string => fixBold(content);

// 마크다운 렌더 커스텀 스타일(스트리밍/완료 공통)
const mdComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-3 first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-semibold mb-1 mt-2 first:mt-0">{children}</h3>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ children, className }) => {
    const isBlock = className?.startsWith('language-');
    return isBlock ? (
      <code className="block bg-gray-800 text-gray-100 rounded-lg px-4 py-3 text-xs overflow-x-auto font-mono my-2 whitespace-pre">
        {children}
      </code>
    ) : (
      <code className="bg-gray-200 text-gray-800 rounded px-1 py-0.5 text-xs font-mono">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-gray-300 pl-3 italic text-gray-600 my-2">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
      <table className="min-w-full text-xs border-collapse border border-gray-300">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-gray-300 px-3 py-1.5 bg-gray-100 font-semibold text-left">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border border-gray-300 px-3 py-1.5">{children}</td>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
      {children}
    </a>
  ),
  hr: () => <hr className="my-3 border-gray-300" />,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
};

interface MessageBubbleProps {
  role?: MessageRole;
  content: string;
  isStreaming?: boolean;
  statusText?: string | null;
}


// 상태 문구가 오기 전(스트리밍 시작 ~ 첫 status 이벤트)에 보여줄 기본 문구.
// 점(●●●) 애니메이션 대신 처음부터 같은 shimmer 문구로 시작해야, 백엔드 상태 문구로
// 바뀔 때 '점 → 텍스트'로 튀지 않고 텍스트만 자연스럽게 교체된다.
const DEFAULT_STATUS = '생각하는 중...';

function GeneratingIndicator({ statusText }: { statusText?: string | null }) {
  const text = statusText || DEFAULT_STATUS;
  return (
    // key={text}: 문구가 바뀔 때마다 다시 마운트되며 fade-in → 교체가 부드럽게 이어진다.
    <span
      key={text}
      // 크기/굵기를 사용자 입력 말풍선 텍스트(text-[15px], 기본 굵기)와 동일하게 맞춘다.
      // select-none: 로딩 문구라 드래그·선택되지 않게 한다.
      className="block text-[15px] status-shimmer animate-fade-in py-0.5 select-none"
    >
      {text}
    </span>
  );
}

export default function MessageBubble({ role = 'assistant', content, isStreaming = false, statusText }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`
          max-w-[70%] py-3 leading-relaxed wrap-break-word
          ${isUser
            ? 'px-5 rounded-[20px_20px_6px_20px] bg-gradient-to-br from-brand to-brand-light text-white text-[15px] shadow-[0_10px_22px_rgba(220,20,60,0.2)] whitespace-pre-wrap'
            : 'pl-1 pr-4 rounded-2xl rounded-tl-sm bg-white text-text-primary text-[15px]'}
        `}
      >
        {isUser ? (
          content
        ) : isStreaming && !content ? (
          <GeneratingIndicator statusText={statusText} />
        ) : (
          <Streamdown
            mode={isStreaming ? 'streaming' : 'static'}
            parseIncompleteMarkdown={isStreaming}
            animated={{ animation: 'fadeIn', sep: 'word', duration: 220, stagger: 25 }}
            isAnimating={isStreaming}
            controls={false}
            className="space-y-0"
            components={mdComponents}
          >
            {isStreaming ? streamMarkdown(content) : normalizeMarkdown(content)}
          </Streamdown>
        )}
      </div>
    </div>
  );
}
