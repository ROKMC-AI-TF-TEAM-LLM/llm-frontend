export interface SearchResult {
  id: string
  title: string
  preview: string
}

interface Props {
  result: SearchResult
  isActive: boolean
  onClick: () => void
}

const SearchResultItem = ({ result, isActive, onClick }: Props) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 pl-4.5 pr-3 py-3 rounded-2xl text-left transition-colors ${
        isActive ? 'bg-brand-soft/50' : 'hover:bg-surface-subtle'
      }`}
    >
      <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg ${isActive ? 'bg-brand-subtle' : 'bg-surface'}`}>
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={isActive ? 'text-brand' : 'text-text-muted'}
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{result.title}</p>
        <p className="text-xs text-text-secondary mt-0.5 truncate">"{result.preview}"</p>
      </div>
    </button>
  )
}

export default SearchResultItem