import { useState } from 'react';
import type { Source } from '../../../types';
import { useDocumentLookup } from '../../../hooks/useDocument';
import { useDocumentDrawer } from '../../../hooks/useDocumentDrawer';
import { findDocumentByName, getDomainStyle, getDomainLabel } from '../../../utils/document';
import DocumentDrawer from '../rag/DocumentDrawer';

interface SourceBadgeProps {
  sources?: Source[];
}

export default function SourceBadge({ sources }: SourceBadgeProps) {
  const [open, setOpen] = useState(false);

  // 출처를 펼쳤을 때만 문서 목록을 불러온다(상세 매칭용).
  const { documents } = useDocumentLookup(open);
  const { doc: drawerDoc, open: drawerOpen, openDoc, closeDoc } = useDocumentDrawer();

  if (!sources || sources.length === 0) return null;

  return (
    <div className="ml-1 mt-1 mb-1">
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
          {sources.map((s, i) => {
            // 문서 목록에서 이름으로 찾는다. 못 찾으면(로딩 중이거나 목록에 없음) 클릭을 막는다.
            const matched = findDocumentByName(documents, s.name);
            // 문서 목록 디자인(RagListItem)과 통일: 도메인 색 아이콘 + 큰 제목 + 종류/도메인 뱃지 + 소속.
            const style = getDomainStyle(matched?.domain);
            const title = (matched?.name ?? s.name).replace(/\.[^/.]+$/, '');

            return (
              <button
                key={i}
                type="button"
                disabled={!matched}
                onClick={() => matched && openDoc(matched)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border border-surface-border bg-surface-subtle text-left transition-colors ${
                  matched ? 'hover:bg-surface hover:border-brand-soft cursor-pointer' : 'cursor-default'
                }`}
              >
                {/* 도메인 색 파일 아이콘 */}
                <div
                  className="shrink-0 flex items-center justify-center"
                  style={{ width: 38, height: 38, borderRadius: 10, background: style.badgeBg, color: style.bar }}
                >
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6M8 13h8M8 17h5" />
                  </svg>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 truncate text-[14px] font-bold text-text-primary">{title}</span>
                    {matched?.type && (
                      <span className="shrink-0 text-[10.5px] font-medium px-1.5 py-0.5 rounded-md bg-surface text-text-secondary border border-surface-border">
                        {matched.type}
                      </span>
                    )}
                    {matched?.domain && (
                      <span
                        className="shrink-0 text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: style.badgeBg, color: style.badgeText }}
                      >
                        {getDomainLabel(matched.domain)}
                      </span>
                    )}
                  </div>
                  {matched?.owning_department && (
                    <p className="mt-0.5 text-[12px] text-text-muted truncate">{matched.owning_department}</p>
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
