import { useState, useEffect } from 'react'
import SearchInput from '../ui/components/search/SearchInput'
import SearchResults from '../ui/components/search/SearchResults'
import type { SearchResult } from '../ui/components/search/SearchResultItem'

const MOCK_RESULTS: SearchResult[] = [
  { id: '1', title: '대화제목대화제목1231231212..', preview: '채팅검색채팅검색채팅검색 관련 기준 포함...' },
  { id: '2', title: 'abcdefghijklmnopqrstuvwxyz', preview: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
  { id: '3', title: '대화제목대화제목59068459080304569084563058343...', preview: '예시example' },
]

const SearchPage = () => {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setSelectedId(null)
      return
    }
    const q = debouncedQuery.toLowerCase()
    const filtered = MOCK_RESULTS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.preview.toLowerCase().includes(q)
    )
    setResults(filtered)
    setSelectedId(filtered[0]?.id ?? null)
  }, [debouncedQuery])

  const handleSelect = (id: string) => {
    setSelectedId(id)
    // TODO: navigate to chat session
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