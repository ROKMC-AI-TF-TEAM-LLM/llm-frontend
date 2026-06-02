import { useRef } from 'react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const SearchInput = ({ value, onChange, placeholder = '채팅 및 대화를 입력하세요...' }: SearchInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      className="group flex items-center gap-3 pl-[18px] pr-4 py-4 rounded-full bg-surface-subtle/60 border border-surface-border transition-all duration-150 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-muted transition-colors duration-150 group-focus-within:text-brand">
          <path d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted"
      />
    </div>
  )
}

export default SearchInput