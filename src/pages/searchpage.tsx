import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchInput from '../ui/components/search/SearchInput'
import SearchResults from '../ui/components/search/SearchResults'
import type { SearchResult } from '../ui/components/search/SearchResultItem'
import { useSearchSessions } from '../hooks/useSession'

const SearchPage = () => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  const { data } = useSearchSessions({ q: debouncedQuery })

  const results: SearchResult[] = (data?.data?.data ?? []).map((s) => ({
    id: s.session_id,
    title: s.title,
    preview: new Date(s.updated_at).toLocaleString('ko-KR'),
  }))

  const handleSelect = (id: string) => {
    setSelectedId(id)
    navigate(`/chat/${id}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-24">
      <h1 className="text-2xl font-medium text-text-primary text-center mb-8">대화 검색</h1>
      <SearchInput value={query} onChange={setQuery} />
      {debouncedQuery && (
        <SearchResults
          results={results}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      )}
    </div>
  )
}

export default SearchPage;
