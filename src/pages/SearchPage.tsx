import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchInput from '../ui/components/search/SearchInput'
import SearchResults from '../ui/components/search/SearchResults'
import type { SearchResult } from '../ui/components/search/SearchResultItem'
import { useSearchSessions, useInfiniteSessions } from '../hooks/useSession'
import { SearchSessionCardSkeleton } from '../ui/components/Skeleton'
import Toast from '../ui/components/Toast'

const SearchPage = () => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  const { data: searchData, isFetching: isSearching, isError: isSearchError } = useSearchSessions({ q: debouncedQuery })
  const { data: sessionsData, isLoading: isSessionsLoading, isError: isSessionsError } = useInfiniteSessions()

  const searchResults: SearchResult[] = (searchData?.data?.data ?? []).map((s) => ({
    id: s.session_id,
    title: s.title,
    preview: new Date(s.updated_at).toLocaleString('ko-KR'),
  }))

  const recentSessions = (sessionsData?.pages ?? []).flatMap((p) => p.data.data.items)

  const handleSelect = (id: string) => {
    setSelectedId(id)
    navigate(`/chat/${id}`)
  }

  const [errorDismissed, setErrorDismissed] = useState(false)
  const showError = (isSearchError || isSessionsError) && !errorDismissed

  return (
    <div className="flex flex-col h-full px-6 pt-16 pb-6">
      {showError && <Toast message="데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요." onClose={() => setErrorDismissed(true)} />}
      <div className="max-w-2xl w-full mx-auto flex flex-col min-h-0 flex-1">

        <h1 className="text-2xl font-semibold text-text-primary text-center mb-8 shrink-0">
          대화 검색
        </h1>

        <div className="shrink-0">
          <SearchInput value={query} onChange={setQuery} />
        </div>

        {debouncedQuery ? (
          <SearchResults
            results={searchResults}
            selectedId={selectedId}
            onSelect={handleSelect}
            isLoading={isSearching}
          />
        ) : (
          <div className="mt-8 flex flex-col min-h-0 flex-1">
            <h2 className="text-sm font-medium text-text-muted mb-4 shrink-0">최근 대화</h2>

            {isSessionsLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(6)].map((_, i) => <SearchSessionCardSkeleton key={i} />)}
              </div>
            ) : recentSessions.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">대화 내역이 없습니다.</p>
            ) : (
              <div className="overflow-y-auto flex-1 custom-scroll">
                <div className="grid grid-cols-2 gap-3 pr-1">
                  {recentSessions.map((session) => (
                    <button
                      key={session.session_id}
                      onClick={() => navigate(`/chat/${session.session_id}`)}
                      className="flex flex-col gap-1.5 p-4 rounded-2xl border border-surface-border hover:bg-surface-subtle text-left transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-surface group-hover:bg-brand-subtle transition-colors">
                          <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-text-muted group-hover:text-brand transition-colors"
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-text-primary truncate">
                          {session.title}
                        </span>
                      </div>
                      <span className="text-xs text-text-muted ml-10">
                        {new Date(session.updated_at).toLocaleString('ko-KR')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default SearchPage