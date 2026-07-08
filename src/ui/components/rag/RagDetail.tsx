import { CATEGORY_STYLE, type RagDoc } from '../../../mocks/ragDocuments'

interface RagDetailProps {
  doc: RagDoc
  onClose: () => void
  onOpen?: () => void
}

// 오른쪽 슬라이드 드로어 안에 들어가는 문서 상세 내용.
// 상단 닫기(X) + 카테고리 뱃지 + 아이콘/제목 + 통계 카드 + 요약 + 태그 + "문서 열기"
const RagDetail = ({ doc, onClose, onOpen }: RagDetailProps) => {
  const style = CATEGORY_STYLE[doc.category]

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
        {/* 카테고리 뱃지 */}
        <span
          className="inline-block text-[12px] font-semibold px-3 py-1 rounded-full"
          style={{ background: style.badgeBg, color: style.badgeText }}
        >
          {doc.category}
        </span>

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

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 mt-6 rounded-2xl bg-surface-subtle overflow-hidden">
          {[
            { label: '페이지', value: `${doc.pages}p` },
            { label: '용량', value: doc.size },
            { label: '등록일', value: doc.date },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center justify-center py-5">
              <span className="text-[11.5px] text-text-muted mb-1.5">{s.label}</span>
              <span className="text-[15px] font-bold text-text-primary">{s.value}</span>
            </div>
          ))}
        </div>

        {/* 요약 */}
        <div className="mt-7">
          <p className="text-[12.5px] font-medium text-text-muted mb-2">문서 요약</p>
          <p className="text-[14px] text-text-primary leading-relaxed">{doc.summary}</p>
        </div>

        {/* 태그 */}
        <span
          className="inline-block mt-5 text-[12px] font-semibold px-3 py-1 rounded-full"
          style={{ background: style.badgeBg, color: style.badgeText }}
        >
          #{doc.badge}
        </span>

        {/* 문서 열기 */}
        <div className="mt-7">
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[15px] font-semibold text-white transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg,#e4002b,#ff2d55)',
              boxShadow: '0 10px 24px rgba(228,0,43,0.28)',
            }}
          >
            문서 열기
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default RagDetail
