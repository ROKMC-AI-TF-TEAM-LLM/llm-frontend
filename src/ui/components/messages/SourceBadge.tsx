import { useState } from 'react';
import type { Source } from '../../../types';

interface SourceBadgeProps {
  sources?: Source[];
}

export default function SourceBadge({ sources }: SourceBadgeProps) {
  const [open, setOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="ml-10 mb-3 mt-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-subtle text-brand text-xs font-medium rounded-full border border-brand-soft hover:bg-brand-soft transition-colors"
      >
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
        출처 {sources.length}개 {open ? '닫기' : '보기'}
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {sources.map((s, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-surface-border bg-surface-subtle">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">
                  {s.name.replace(/\.[^/.]+$/, '')}
                </p>
                {s.page && (
                  <p className="text-xs text-text-muted mt-0.5">페이지 {s.page}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
