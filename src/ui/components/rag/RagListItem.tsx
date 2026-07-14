import type { DocumentItem } from '../../../types/document'
import { getDomainStyle, getDomainLabel, formatAppliedAt } from '../../../utils/document'

interface RagListItemProps {
  doc: DocumentItem
  onClick?: () => void
}

// 문서 리스트의 한 행: 도메인 색 막대 + 파일 아이콘 + 이름/종류 + 우측 메타(부서·적용일) + →
const RagListItem = ({ doc, onClick }: RagListItemProps) => {
  // 도메인 값을 미리 모르므로 색은 값에서 결정적으로 파생한다.
  const style = getDomainStyle(doc.domain)

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full flex items-center gap-4 py-3 pl-2 pr-5 text-left bg-surface border-b border-surface-border transition-colors hover:bg-surface-subtle"
    >
      {/* 도메인 색 막대 */}
      <span
        className="shrink-0 flex items-center rounded-full"
        style={{ height: 40, width: 5, background: style.bar }}
        aria-hidden
      />

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

      {/* 이름 + 파일 종류 뱃지 + 도메인 뱃지 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="min-w-0 truncate text-[15px] font-bold text-text-primary">{doc.name}</span>
          {doc.type && (
            <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-md bg-surface-subtle text-text-secondary">
              {doc.type}
            </span>
          )}
          {doc.domain && (
            <span
              className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: style.badgeBg, color: style.badgeText }}
            >
              {getDomainLabel(doc.domain)}
            </span>
          )}
        </div>
        {doc.owning_department && (
          <p className="mt-1 text-[13px] text-text-secondary truncate">{doc.owning_department}</p>
        )}
      </div>

      {/* 우측 메타 + 화살표 */}
      <div className="shrink-0 flex items-center gap-4">
        {doc.applied_at && (
          <span className="text-[12.5px] text-text-muted whitespace-nowrap">
            {formatAppliedAt(doc.applied_at)}
          </span>
        )}
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
