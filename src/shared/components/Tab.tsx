import type { ButtonHTMLAttributes } from 'react'

interface TabProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'style' | 'className'
> {
  selected: boolean
}

/**
 * 밑줄로 고른 것을 표시하는 탭. 탭 줄(아래 테두리가 있는 flex 상자, role="tablist") 안에 나란히 놓는다.
 */
export default function Tab({ selected, children, ...props }: TabProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      className={`relative shrink-0 px-3.5 pb-2.5 pt-1 text-14 font-semibold transition-colors ${
        selected ? 'text-brand' : 'text-text-muted hover:text-text-primary'
      }`}
      {...props}
    >
      {children}
      {selected && (
        <span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-brand" />
      )}
    </button>
  )
}
