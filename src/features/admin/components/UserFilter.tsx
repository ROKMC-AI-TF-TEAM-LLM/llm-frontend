import { CloseIcon, SearchIcon } from '@/shared/components/icons'
import { USER_TABS, type UserStatusTab } from '../utils'

interface UserFilterProps {
  status: UserStatusTab
  onStatusChange: (status: UserStatusTab) => void
  query: string
  onQueryChange: (query: string) => void
}

/** 사용자 목록 위의 상태 탭과 이름·이메일 검색 */
export function UserFilter({
  status,
  onStatusChange,
  query,
  onQueryChange,
}: UserFilterProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex gap-2">
        {USER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onStatusChange(tab.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              status === tab.value
                ? 'bg-brand text-white'
                : 'bg-surface text-text-secondary border border-surface-border hover:bg-surface-subtle'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="relative ml-auto group">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted transition-colors duration-200 group-focus-within:text-brand" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="이름 또는 이메일 검색.."
          className="pl-9 pr-9 py-1.5 text-sm rounded-xl border border-surface-border bg-surface text-text-primary placeholder-text-muted focus:outline-none transition-colors w-56 text-center"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            aria-label="검색어 지우기"
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors"
          >
            <CloseIcon className="w-4 h-4" strokeWidth={2.2} />
          </button>
        )}
      </div>
    </div>
  )
}
