import { CATEGORY_STYLE, type RagDoc } from '../../../mocks/ragDocuments'

interface RagListItemProps {
  doc: RagDoc
  onClick?: () => void
}

// 문서 리스트의 한 행: 좌측 카테고리 색 보더 + 파일 아이콘 + 제목/뱃지/설명 + 우측 메타(페이지·용량·날짜) + →
const RagListItem = ({ doc, onClick }: RagListItemProps) => {
  const style = CATEGORY_STYLE[doc.category]

  return (
    <button
      type="button"
      onClick={onClick}
      className="doc-card group w-full flex items-center gap-4 py-4 pl-4 pr-5 text-left bg-surface rounded-xl border border-surface-border"
      style={{ borderLeft: `3px solid ${style.bar}` }}
    >
      {/* 파일 아이콘 */}
      <div
        className="shrink-0 flex items-center justify-center"
        style={{ width: 40, height: 40, borderRadius: 11, background: style.badgeBg, color: style.bar }}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M8 13h8M8 17h5" />
        </svg>
      </div>

      {/* 제목 + 뱃지 + 설명 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="min-w-0 truncate text-[15px] font-bold text-text-primary">{doc.name}</span>
          <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-md bg-surface-subtle text-text-secondary">
            {doc.badge}
          </span>
        </div>
        <p className="mt-1 text-[13px] text-text-secondary truncate">{doc.description}</p>
      </div>

      {/* 우측 메타 + 화살표 */}
      <div className="shrink-0 flex items-center gap-4">
        <span className="text-[12.5px] text-text-muted whitespace-nowrap">
          {doc.pages}p · {doc.size} · {doc.date}
        </span>
        <span
          className="text-text-muted transition-all duration-200 group-hover:text-[var(--color-brand)] group-hover:translate-x-0.5"
          aria-hidden
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </div>
    </button>
  )
}

export default RagListItem
