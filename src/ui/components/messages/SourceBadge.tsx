import { useState } from 'react';
import type { Source, Notice } from '../../../types';
import { useDocumentLookup } from '../../../hooks/useDocument';
import { useDocumentDrawer } from '../../../hooks/useDocumentDrawer';
import { findDocumentByName, getDomainStyle, getDomainLabel } from '../../../utils/document';
import DocumentDrawer from '../rag/DocumentDrawer';

interface SourceBadgeProps {
  sources?: Source[];
  notice?: Notice;
}

export default function SourceBadge({ sources, notice }: SourceBadgeProps) {
  const [open, setOpen] = useState(false);

  const hasSources = !!sources && sources.length > 0;
  const { documents, isLoading } = useDocumentLookup(hasSources);
  const { doc: drawerDoc, open: drawerOpen, openDoc, closeDoc } = useDocumentDrawer();

  if (!hasSources && !notice) return null;

  return (
    <div className="ml-1 mt-1 mb-1">
      {hasSources && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-subtle text-brand text-xs font-medium rounded-full border border-brand-soft hover:bg-brand-soft transition-colors"
        >
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
            <path d="m6 9 6 6 6-6" />
          </svg>
          출처 {sources!.length}개 {open ? '닫기' : '보기'}
        </button>
      )}

      {notice && (
        <p role="note" className={`text-[11.5px] leading-relaxed text-text-muted ${hasSources ? 'mt-1.5' : ''}`}>
          {notice.message}
        </p>
      )}

      {hasSources && open && (
        <div className="mt-2 space-y-2">
          {sources.map((s, i) => {
            const matched = findDocumentByName(documents, s.name);
            const style = getDomainStyle(matched?.domain);
            const title = (matched?.name ?? s.name).replace(/\.[^/.]+$/, '');

            return (
              <button
                key={i}
                type="button"
                disabled={!matched}
                onClick={() => matched && openDoc(matched)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border border-[#f0e6e8] bg-white text-left transition-colors ${
                  matched ? 'hover:bg-surface-subtle hover:border-brand-soft cursor-pointer' : 'cursor-default'
                }`}
              >
                <div
                  className="shrink-0 flex items-center justify-center"
                  style={{ width: 38, height: 38, borderRadius: 10, background: style.badgeBg, color: style.bar }}
                >
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6M8 13h8M8 17h5" />
                  </svg>
                </div>

                <div className="min-w-0 flex-1 flex items-center gap-2">
                  <span className="min-w-0 truncate text-[14px] font-bold text-text-primary">{title}</span>
                  {isLoading && !matched ? (
                    <span className="h-3 w-24 shrink-0 rounded-full bg-surface-subtle animate-pulse" />
                  ) : (
                    <span className="min-w-0 truncate flex items-center gap-1.5 text-[12px] text-text-muted">
                      {matched?.type && <span>{matched.type}</span>}
                      {matched?.type && matched?.domain && <span aria-hidden>·</span>}
                      {matched?.domain && <span style={{ color: style.badgeText }}>{getDomainLabel(matched.domain)}</span>}
                      {matched?.domain && matched?.owning_department && <span aria-hidden>·</span>}
                      {matched?.owning_department && <span>{matched.owning_department}</span>}
                      {!matched && s.page && <span>p.{s.page}</span>}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <DocumentDrawer doc={drawerDoc} open={drawerOpen} onClose={closeDoc} />
    </div>
  );
}
