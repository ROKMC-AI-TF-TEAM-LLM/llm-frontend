import { useRef } from 'react'
import { CloseIcon, SearchAlt2Icon } from '@/shared/components/icons'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const SearchInput = ({ value, onChange, placeholder = '채팅 및 대화를 입력하세요...' }: SearchInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      style={{ background: '#fff', border: '1px solid #f0e3e6', boxShadow: '0 10px 26px rgba(40,30,35,0.05)' }}
      className="group flex items-center gap-3 pl-[20px] pr-5 py-[18px] rounded-[22px] transition-all duration-200 focus-within:border-[#e4002b] focus-within:shadow-[0_0_0_3px_rgba(228,0,43,0.08)] cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <SearchAlt2Icon width="20" height="20" className="shrink-0 text-[#c9aab2] transition-colors duration-200 group-focus-within:text-[#e4002b]" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-text-primary placeholder:text-[#b8a7ac]"
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
          className="shrink-0 flex items-center justify-center w-[26px] h-[26px] rounded-full text-[#c9aab2] hover:text-text-primary hover:bg-surface-subtle transition-colors"
        >
          <CloseIcon width={17} height={17} strokeWidth={2.2} />
        </button>
      )}
    </div>
  )
}

export default SearchInput