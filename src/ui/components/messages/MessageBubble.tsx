import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { MessageRole } from '../../../types';

const normalizeMarkdown = (content: string): string =>
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
    })
    .replace(/([^\n])\n(#{1,6} )/g, '$1\n\n$2')
    .replace(/^[•·–—]\s*/gm, '- ')
    .replace(/([가-힣]) +(을|를|에|에서|은|는|이|가|으로|로|와|과)(?=[\s,.?!]|$)/gm, '$1$2');

interface MessageBubbleProps {
  role?: MessageRole;
  content: string;
  isStreaming?: boolean;
}

function StreamingCursor() {
  return (
    <span className="inline-block w-[3px] h-[18px] ml-0.5 align-middle bg-text-secondary rounded-sm animate-cursor-blink" />
  );
}

function GeneratingIndicator() {
  return (
    <div className="flex items-center gap-[7px] py-0.5">
      {[0, 200, 400, 600].map((delay) => (
        <span
          key={delay}
          className="dot-chase"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

export default function MessageBubble({ role = 'assistant', content, isStreaming = false }: MessageBubbleProps) {
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
          max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed wrap-break-word
          ${isUser
            ? 'bg-brand text-white rounded-tr-sm whitespace-pre-wrap'
            : 'bg-white text-text-primary rounded-tl-sm'}
        `}
      >
        {isUser ? (
          content
        ) : isStreaming && !content ? (
          <GeneratingIndicator />
        ) : (
          <>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
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
              }}
            >
              {normalizeMarkdown(content)}
            </ReactMarkdown>
            {isStreaming && <StreamingCursor />}
          </>
        )}
      </div>
    </div>
  );
}
