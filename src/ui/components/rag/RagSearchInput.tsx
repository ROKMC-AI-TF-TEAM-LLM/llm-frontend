import { useRef } from 'react'

interface RagSearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const RagSearchInput = ({
  value,
  onChange,
  placeholder = '법령 및 규정을 입력하세요...',
}: RagSearchInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      className="group flex items-center gap-3 pl-[18px] pr-4 py-4 rounded-full bg-surface-subtle/60 border border-surface-border transition-all duration-150 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <svg
        className="shrink-0 transition-colors duration-150 text-text-muted group-focus-within:text-brand"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
      />
    </div>
  )
}

export default RagSearchInput