import SearchResultItem, { type SearchResult } from './SearchResultItem'

interface Props {
  results: SearchResult[]
  selectedId: string | null
  onSelect: (id: string) => void
}

const SearchResults = ({ results, selectedId, onSelect }: Props) => {
  if (!results.length) return null

  return (
    <div className="mt-10">
      <h2 className="text-l font-medium text-text-primary text-center mb-2">검색 결과</h2>
      <div className="space-y-0.5">
        {results.map((result) => (
          <SearchResultItem
            key={result.id}
            result={result}
            isActive={result.id === selectedId}
            onClick={() => onSelect(result.id)}
          />
        ))}
      </div>
    </div>
  )
}

export default SearchResults