import type { DocumentItem } from '../../../types/document'
import { getDomainStyle, getDomainLabel, formatAppliedAt } from '../../../utils/document'

interface RagDetailProps {
  doc: DocumentItem
  onClose: () => void
}

// 오른쪽 슬라이드 드로어 안에 들어가는 문서 상세.
// 서버가 주는 필드(name, type, domain, visibility, owning_department, applied_at)만 표시한다.
const RagDetail = ({ doc, onClose }: RagDetailProps) => {
  const style = getDomainStyle(doc.domain)

  const rows = [
    { label: '문서 종류', value: doc.type },
    { label: '소유 부서', value: doc.owning_department },
    { label: '공개 범위', value: doc.visibility },
    { label: '적용일', value: formatAppliedAt(doc.applied_at) },
  ].filter((r) => !!r.value)

  return (
    <div className="flex flex-col h-full">
      {/* 상단 바: 닫기 */}
      <div className="flex items-center justify-end h-14 px-5 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="text-text-muted hover:text-text-primary transition-colors"
          aria-label="닫기"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 본문 (넘치면 스크롤) */}
      <div className="flex-1 overflow-y-auto custom-scroll px-8 pb-10">
        {/* 도메인 뱃지 */}
        {doc.domain && (
          <span
            className="inline-block text-[12px] font-semibold px-3 py-1 rounded-full"
            style={{ background: style.badgeBg, color: style.badgeText }}
          >
            {getDomainLabel(doc.domain)}
          </span>
        )}

        {/* 아이콘 + 제목 */}
        <div className="flex items-center gap-3.5 mt-4">
          <div
            className="shrink-0 flex items-center justify-center"
            style={{ width: 48, height: 48, borderRadius: 13, background: style.badgeBg, color: style.bar }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6M8 13h8M8 17h5" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-text-primary break-all leading-snug">{doc.name}</h1>
        </div>

        {/* 상세 정보 */}
        {rows.length > 0 && (
          <dl className="mt-7 rounded-2xl bg-surface-subtle overflow-hidden divide-y divide-surface-border">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-4 px-5 py-4">
                <dt className="text-[12.5px] text-text-muted shrink-0">{r.label}</dt>
                <dd className="text-[14px] font-semibold text-text-primary text-right break-all">{r.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  )
}

export default RagDetail
