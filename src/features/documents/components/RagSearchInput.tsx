import { useRef } from 'react'
import { CloseIcon, SearchIcon } from '@/shared/components/icons'

interface RagSearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  compact?: boolean
}

const RagSearchInput = ({
  value,
  onChange,
  placeholder = '법령 및 규정을 입력하세요...',
  compact = false,
}: RagSearchInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-rose-border)',
        boxShadow: compact
          ? '0 2px 8px rgba(40,30,35,0.04)'
          : '0 10px 26px rgba(40,30,35,0.05)',
      }}
      className={`group flex items-center transition-all duration-200 focus-within:border-brand-vivid focus-within:shadow-[0_0_0_3px_rgba(228,0,43,0.08)] cursor-text ${
        compact
          ? 'gap-2.5 px-4 py-2.5 rounded-xl'
          : 'gap-3 pl-[20px] pr-5 py-[18px] rounded-[22px]'
      }`}
      onClick={() => inputRef.current?.focus()}
    >
      <SearchIcon
        className="shrink-0 transition-colors duration-200 text-rose-muted group-focus-within:text-brand-vivid"
        width={compact ? 17 : 20}
        height={compact ? 17 : 20}
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`flex-1 min-w-0 bg-transparent text-text-primary placeholder:text-rose-placeholder outline-none ${
          compact ? 'text-14' : 'text-15'
        }`}
      />
      {value && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onChange('')
            inputRef.current?.focus()
          }}
          aria-label="검색어 지우기"
          className="shrink-0 flex items-center justify-center rounded-full text-rose-muted hover:text-text-primary hover:bg-surface-subtle transition-colors"
          style={{ width: compact ? 22 : 26, height: compact ? 22 : 26 }}
        >
          <CloseIcon
            width={compact ? 15 : 17}
            height={compact ? 15 : 17}
            strokeWidth={2.2}
          />
        </button>
      )}
    </div>
  )
}

export default RagSearchInput
