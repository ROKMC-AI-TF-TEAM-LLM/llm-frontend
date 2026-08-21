import { useState } from 'react';
import { Streamdown } from 'streamdown';
import type { Components } from 'streamdown';
import type { MessageRole, StatusStep } from '../../../types';

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

const streamMarkdown = (content: string): string => fixBold(content);

const mdComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-3 first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-semibold mb-1 mt-2 first:mt-0">{children}</h3>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }) => {
    const isEmpty =
      children == null ||
      (Array.isArray(children) && children.every((c) => c == null || c === '' || (typeof c === 'string' && c.trim() === '')));
    if (isEmpty) return null;
    return <li className="leading-relaxed">{children}</li>;
  },
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
  statusSteps?: StatusStep[];
}

const DEFAULT_STATUS = '생각하는 중';

function ReasoningTimeline({ steps, live = false }: { steps: StatusStep[]; live?: boolean }) {
  return (
    <ul className="mt-2.5 flex flex-col">
      {steps.map((s, i) => {
        const isLast = i === steps.length - 1;
        const isCurrent = live && isLast;
        return (
          <li key={`${i}-${s.message}`} className="relative flex gap-3 pb-3.5 last:pb-0">
            {!isLast && (
              <span className="absolute left-[5px] top-[9px] bottom-[-5px] w-px -translate-x-1/2 bg-surface-border" />
            )}
            <span
              className={`relative mt-[6px] h-2.5 w-2.5 shrink-0 rounded-full ${
                isCurrent ? 'bg-text-muted status-dot-blink' : 'bg-brand'
              }`}
            />
            <div className="min-w-0">
              <p className={`text-[13px] leading-[1.5] font-medium ${isCurrent ? 'text-text-muted' : 'text-text-secondary'}`}>
                {s.message}
              </p>
              {s.thought && (
                <p className="mt-1 text-[12.5px] leading-relaxed text-text-muted">{s.thought}</p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ReasoningBlock({
  steps,
  statusText,
  done = false,
  seconds,
}: {
  steps?: StatusStep[];
  statusText?: string | null;
  done?: boolean;
  seconds?: number;
}) {
  const list = steps && steps.length > 0 ? steps : [{ message: statusText || DEFAULT_STATUS }];
  const current = list[list.length - 1];
  const [open, setOpen] = useState(false);
  const hasDetail = !done || list.length > 1 || list.some((s) => s.thought);

  const headerLabel = done
    ? seconds != null
      ? `${seconds}초 동안 생각함`
      : '추론 과정'
    : current.message;

  return (
    <div className="animate-fade-in select-none">
      <button
        type="button"
        onClick={() => hasDetail && setOpen((v) => !v)}
        className={`flex items-center gap-2 text-[13.5px] ${hasDetail ? 'cursor-pointer' : 'cursor-default'}`}
      >
        {!done && (
          <span className="h-3.5 w-3.5 shrink-0 rounded-full border-[1.5px] border-brand border-t-transparent animate-spin" />
        )}
        <span className={done ? 'font-medium text-text-muted' : 'font-semibold status-blink'}>
          {headerLabel}
        </span>
        {hasDetail && (
          <svg
            width={13}
            height={13}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </button>
      {hasDetail && (
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(.32,.72,0,1)]"
          style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden">
            <ReasoningTimeline steps={list} live={!done} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessageBubble({ role = 'assistant', content, isStreaming = false, statusText, statusSteps }: MessageBubbleProps) {
  const isUser = role === 'user';
  const showSteps = !isUser && isStreaming && !content;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`
          py-3 leading-relaxed wrap-break-word
          ${isUser
            ? 'max-w-[70%] px-5 rounded-[20px_20px_6px_20px] bg-gradient-to-br from-brand to-brand-light text-white text-[15px] shadow-[0_10px_22px_rgba(220,20,60,0.2)] whitespace-pre-wrap'
            : 'max-w-[78%] pl-1 pr-4 rounded-2xl rounded-tl-sm bg-white text-text-primary text-[15px]'}
        `}
      >
        {isUser ? (
          content
        ) : (
          <>
            {showSteps && (
              <div className={content ? 'mb-3' : undefined}>
                <ReasoningBlock steps={statusSteps} statusText={statusText} />
              </div>
            )}
            {content && (
              <Streamdown
                mode={isStreaming ? 'streaming' : 'static'}
                parseIncompleteMarkdown={isStreaming}
                animated={isStreaming ? { animation: 'fadeIn', sep: 'char', duration: 120, stagger: 8 } : undefined}
                isAnimating={isStreaming}
                controls={false}
                className="space-y-0"
                components={mdComponents}
              >
                {isStreaming ? streamMarkdown(content) : normalizeMarkdown(content)}
              </Streamdown>
            )}
          </>
        )}
      </div>
    </div>
  );
}
