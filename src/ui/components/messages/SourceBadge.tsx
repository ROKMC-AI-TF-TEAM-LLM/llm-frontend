import { useState } from 'react';
import type { Source } from '../../../types';

interface SourceBadgeProps {
  sources?: Source[];
}

export default function SourceBadge({ sources = [] }: SourceBadgeProps) {
  const [open, setOpen] = useState<boolean>(false);

  if (!sources.length) return null;

  return (
    <div className="ml-12 mb-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="
          inline-flex items-center gap-1 px-3 py-1
          bg-brand-subtle text-brand text-xs font-medium
          rounded-full border border-brand-soft
          hover:bg-brand-soft transition-colors
        "
      >
        출처 {sources.length}개 보기
        <svg
          width={12}
          height={12}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul className="mt-2 space-y-1 pl-2 border-l-2 border-brand-soft">
          {sources.map((s, i) => (
            <li key={i} className="text-xs text-text-secondary">
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="hover:text-brand hover:underline"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}