import { useState } from 'react';

interface MessageActionsProps {
  role?: 'user' | 'assistant';
  onCopy?: () => void;
  onRegenerate?: () => void;
  regenerateDisabled?: boolean;
  createdAt?: string;
}

function formatTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${m}`;
}

function formatFullDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mo = d.getMonth() + 1;
  const dd = d.getDate();
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${yyyy}년 ${mo}월 ${dd}일 ${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${m}`;
}

export default function MessageActions({ role = 'assistant', onCopy, onRegenerate, regenerateDisabled = false, createdAt }: MessageActionsProps) {
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const time = formatTime(createdAt);
  const fullDate = formatFullDate(createdAt);

  const iconBtn =
    'flex items-center justify-center w-7 h-7 rounded-md text-text-muted hover:bg-surface-subtle hover:text-text-secondary transition-colors';

  return (
    <div
      className={`flex items-center gap-0.5 mt-0.5 mb-2 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-150 ${isUser ? 'justify-end' : 'ml-10'}`}
    >
      {time && (
        <div className="relative group/time mr-1.5">
          <span className="text-[11px] text-text-muted cursor-default tabular-nums">{time}</span>
          <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded px-1.5 py-0.5 text-[10px] whitespace-nowrap bg-gray-800 text-white opacity-0 group-hover/time:opacity-100 transition-opacity">
            {fullDate}
          </span>
        </div>
      )}

      {onRegenerate && (
        <div className="relative group/regen">
          <button
            type="button"
            onClick={onRegenerate}
            disabled={regenerateDisabled}
            className={`${iconBtn} disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-muted`}
            aria-label="다시 생성"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
          {!regenerateDisabled && (
            <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded px-1.5 py-0.5 text-[10px] whitespace-nowrap bg-gray-800 text-white opacity-0 group-hover/regen:opacity-100 transition-opacity">
              재생성
            </span>
          )}
        </div>
      )}

      <div className="relative group/copy">
        <button
          type="button"
          onClick={handleCopy}
          className={`${iconBtn} ${copied ? 'text-brand hover:text-brand' : ''}`}
          aria-label="복사"
        >
          {copied ? (
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
        {!copied && (
          <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded px-1.5 py-0.5 text-[10px] whitespace-nowrap bg-gray-800 text-white opacity-0 group-hover/copy:opacity-100 transition-opacity">
            복사
          </span>
        )}
      </div>
    </div>
  );
}
