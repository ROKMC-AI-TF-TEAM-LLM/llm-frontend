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
      className={`card flex flex-col w-full p-5 text-left transition-all duration-150 cursor-pointer active:scale-[0.98] ${
        selected
          ? 'border-[1.5px] border-brand bg-brand-subtle'
          : 'bg-surface-subtle'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium truncate mr-2 text-text-primary">
          {title}
        </span>
        <span className={[
          'shrink-0 text-[11px] font-medium px-2.5 py-0.5 rounded-full',
          selected
            ? 'bg-brand-soft text-brand'
            : 'bg-surface-border text-text-secondary',
        ].join(' ')}>
          {fileType}
        </span>
      </div>
      <p className="flex-1 text-xs leading-relaxed line-clamp-4 break-all text-text-secondary">
        {preview}
      </p>
    </button>
  )
}

export default RagCard