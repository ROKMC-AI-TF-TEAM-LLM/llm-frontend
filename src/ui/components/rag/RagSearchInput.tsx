import { useRef } from 'react'

interface RagSearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** 헤더 우측에 들어가는 작은 검색창(문서 페이지). 기본은 큰 히어로 검색창. */
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
        background: '#fff',
        border: '1px solid #f0e3e6',
        boxShadow: compact ? '0 2px 8px rgba(40,30,35,0.04)' : '0 10px 26px rgba(40,30,35,0.05)',
      }}
      className={`group flex items-center transition-all duration-200 focus-within:border-[#e4002b] focus-within:shadow-[0_0_0_3px_rgba(228,0,43,0.08)] cursor-text ${
        compact ? 'gap-2.5 px-4 py-2.5 rounded-xl' : 'gap-3 pl-[20px] pr-5 py-[18px] rounded-[22px]'
      }`}
      onClick={() => inputRef.current?.focus()}
    >
      <svg
        className="shrink-0 transition-colors duration-200 text-[#c9aab2] group-focus-within:text-[#e4002b]"
        width={compact ? 17 : 20}
        height={compact ? 17 : 20}
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
        className={`flex-1 min-w-0 bg-transparent text-text-primary placeholder:text-[#b8a7ac] outline-none ${
          compact ? 'text-[14px]' : 'text-[15px]'
        }`}
      />
      {value && (
        <button
          type="button"
          onClick={(e) => {
            // 부모 div의 onClick(포커스)로 이벤트가 번지지 않게 한 뒤, 지우고 포커스는 유지.
            e.stopPropagation()
            onChange('')
            inputRef.current?.focus()
          }}
          aria-label="검색어 지우기"
          className="shrink-0 flex items-center justify-center rounded-full text-[#c9aab2] hover:text-text-primary hover:bg-surface-subtle transition-colors"
          style={{ width: compact ? 22 : 26, height: compact ? 22 : 26 }}
        >
          <svg
            width={compact ? 15 : 17}
            height={compact ? 15 : 17}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default RagSearchInput