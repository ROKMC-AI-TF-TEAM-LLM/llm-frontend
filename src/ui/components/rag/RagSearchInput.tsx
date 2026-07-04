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
      style={{ background: '#fff', border: '1px solid #f0e3e6', boxShadow: '0 12px 30px rgba(160,0,40,0.05)' }}
      className="group flex items-center gap-3 pl-[20px] pr-5 py-[18px] rounded-[22px] transition-all duration-200 focus-within:border-[#e4002b] focus-within:shadow-[0_0_0_3px_rgba(228,0,43,0.08)] cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <svg
        className="shrink-0 transition-colors duration-200 text-[#c9aab2] group-focus-within:text-[#e4002b]"
        width="20"
        height="20"
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
        className="flex-1 bg-transparent text-[15px] text-text-primary placeholder:text-[#b8a7ac] outline-none"
      />
    </div>
  )
}

export default RagSearchInput