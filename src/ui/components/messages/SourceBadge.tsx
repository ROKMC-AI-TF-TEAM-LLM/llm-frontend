import type { Source } from '../../../types';

interface SourceBadgeProps {
  sources?: Source[];
}

export default function SourceBadge({ sources }: SourceBadgeProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="ml-10 mb-3 mt-2 flex flex-wrap gap-2 items-center">
      <span className="text-xs font-bold text-text-muted">근거 문서</span>
      {sources.map((s, i) => (
        <span
          key={i}
          className="text-xs font-semibold text-brand-hover bg-brand-subtle border border-brand-soft px-3 py-1.5 rounded-full"
        >
          {s.name.replace(/\.[^/.]+$/, '')}
          {s.page ? <span className="ml-1 font-medium opacity-70">p.{s.page}</span> : null}
        </span>
      ))}
    </div>
  );
}
