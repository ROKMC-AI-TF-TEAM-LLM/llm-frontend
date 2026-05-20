import { useState } from 'react';

interface MessageActionsProps {
  role?: 'user' | 'assistant';
  onCopy?: () => void;
  onRegenerate?: () => void;
}

export default function MessageActions({ role = 'assistant', onCopy, onRegenerate }: MessageActionsProps) {
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`flex items-center gap-2 mt-1 mb-2 text-text-muted ${isUser ? 'justify-end' : 'ml-12'}`}>
      <button
        type="button"
        onClick={handleCopy}
        className={`flex items-center gap-1 px-1.5 h-6 rounded transition-colors text-xs
          ${copied
            ? 'text-brand bg-brand-subtle'
            : 'hover:bg-surface-subtle hover:text-text-secondary'
          }`}
        aria-label="복사"
      >
        {copied ? (
          <>
            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <span>복사됨</span>
          </>
        ) : (
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
      {!isUser && (
        <button
          type="button"
          onClick={onRegenerate}
          className="p-1 rounded hover:bg-surface-subtle hover:text-text-secondary transition-colors"
          aria-label="다시 생성"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      )}
    </div>
  );
}