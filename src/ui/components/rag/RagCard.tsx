interface RagCardProps {
  title: string
  fileType: 'PDF' | 'HWP' | string
  preview: string
  selected?: boolean
  onClick?: () => void
}

const RagCard = ({ title, fileType, preview, selected = false, onClick }: RagCardProps) => {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick?.() }}
      className="doc-card group w-full flex flex-col gap-[14px] p-[22px] text-left cursor-pointer"
      style={{
        borderRadius: 16,
        background: selected ? '#fdeef1' : '#fff',
        border: selected ? '1.5px solid #e4002b' : '1px solid #f0e3e6',
        boxShadow: selected
          ? '0 0 0 3px rgba(228,0,43,0.08), 0 12px 28px rgba(160,0,40,0.06)'
          : '0 12px 28px rgba(160,0,40,0.04)',
        transition: 'transform .3s cubic-bezier(.2,.7,.2,1), box-shadow .3s ease, border-color .3s ease',
      }}
    >
      {/* 상단: 파일 아이콘 + 이름 + 타입 뱃지 */}
      <div className="flex items-start justify-between gap-[14px]">
        <div className="flex items-center gap-[13px] min-w-0">
          <div
            style={{
              width: 40, height: 40, flexShrink: 0,
              borderRadius: 11,
              background: selected ? 'linear-gradient(135deg,#e4002b,#ff2d55)' : 'linear-gradient(135deg,#fff0f3,#fde3e8)',
              border: selected ? '1px solid transparent' : '1px solid #f7d7de',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: selected ? '#fff' : '#e4002b',
            }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6M8 13h8M8 17h5" />
            </svg>
          </div>
          <span
            className="min-w-0 flex-1 text-[15px] font-bold truncate"
            style={{ color: selected ? '#c0002a' : '#1f1f22' }}
          >
            {title}
          </span>
        </div>
        <span
          style={{
            flexShrink: 0,
            fontSize: 11, fontWeight: 800, letterSpacing: '0.06em',
            color: selected ? '#fff' : '#c0002a',
            background: selected ? '#e4002b' : '#fdeef1',
            border: selected ? '1px solid transparent' : '1px solid #f7d7de',
            padding: '4px 10px', borderRadius: 8,
          }}
        >
          {fileType}
        </span>
      </div>

      {/* 하단: 날짜 + hover 시 "열기 →" */}
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 13, color: '#a89aa0', fontWeight: 500 }}>{preview}</span>
        <span
          className="doc-open"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 13, fontWeight: 700,
            color: selected ? '#e4002b' : '#e4002b',
            opacity: selected ? 1 : 0,
            transform: selected ? 'translateX(0)' : 'translateX(-6px)',
            transition: 'all .3s cubic-bezier(.2,.7,.2,1)',
          }}
        >
          자세히 보기 →
        </span>
      </div>

    </button>
  )
}

export default RagCard
