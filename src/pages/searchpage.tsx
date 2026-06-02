import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchInput from '../ui/components/search/SearchInput'
import SearchResults from '../ui/components/search/SearchResults'
import type { SearchResult } from '../ui/components/search/SearchResultItem'
import { useSearchSessions, useGetSessions } from '../hooks/useSession'
import { SearchSessionCardSkeleton } from '../ui/components/Skeleton'

const SearchPage = () => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  const { data: searchData, isFetching: isSearching } = useSearchSessions({ q: debouncedQuery })
  const { data: sessionsData, isLoading: isSessionsLoading } = useGetSessions()

  const searchResults: SearchResult[] = (searchData?.data?.data ?? []).map((s) => ({
    id: s.session_id,
    title: s.title,
    preview: new Date(s.updated_at).toLocaleString('ko-KR'),
  }))

  const recentSessions = sessionsData?.data?.data?.items ?? []

  const handleSelect = (id: string) => {
    setSelectedId(id)
    navigate(`/chat/${id}`)
  }

  return (
    <div className="flex flex-col h-full px-6 pt-16 pb-6">
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
