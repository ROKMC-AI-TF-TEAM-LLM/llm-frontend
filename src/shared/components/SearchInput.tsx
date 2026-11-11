import { useRef } from 'react'
import { CloseIcon, SearchIcon } from './icons'
import IconButton from './IconButton'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  /** 목록 위에 붙는 작은 크기 */
  compact?: boolean
}

/** 검색어 입력창. 어디를 눌러도 입력이 시작되고, 입력 중에는 테두리가 강조색으로 바뀐다 */
const SearchInput = ({
  value,
  onChange,
  placeholder,
  compact = false,
}: SearchInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      className={`group flex items-center bg-surface border border-rose-border transition-all duration-200 focus-within:border-brand-vivid focus-within:shadow-[0_0_0_3px_rgba(228,0,43,0.08)] cursor-text ${
        compact
          ? 'gap-2.5 px-4 py-2.5 rounded-xl shadow-[0_2px_8px_rgba(40,30,35,0.04)]'
          : 'gap-3 pl-[20px] pr-5 py-[18px] rounded-[22px] shadow-[0_10px_26px_rgba(40,30,35,0.05)]'
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
        <IconButton
          size="xs"
          onClick={(e) => {
            e.stopPropagation()
            onChange('')
            inputRef.current?.focus()
          }}
          label="검색어 지우기"
        >
          <CloseIcon
            width={compact ? 15 : 17}
            height={compact ? 15 : 17}
            strokeWidth={2.2}
          />
        </IconButton>
      )}
    </div>
  )
}

export default SearchInput
