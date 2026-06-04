import { useState } from 'react'
import RagSearchInput from '../ui/components/rag/RagSearchInput'
import RagCard from '../ui/components/rag/RagCard'
import { useInfiniteDocuments } from '../hooks/useDocument'

const RagPage = () => {
  const [query, setQuery] = useState('')
  const [selectedName, setSelectedName] = useState<string | null>(null)

  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteDocuments()

  const allDocuments = data?.pages.flatMap((p) => p.data.data.documents) ?? []

  const filtered = allDocuments.filter((doc) =>
    doc.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="min-h-full w-full" onClick={() => setSelectedName(null)}>
      <div className="max-w-2xl mx-auto px-8 py-12">
        <h1 className="text-2xl font-semibold text-text-primary mb-5">문서</h1>
        <RagSearchInput value={query} onChange={setQuery} placeholder="문서 검색..." />

        {isError && (
          <p className="mt-6 text-sm text-center text-text-muted">문서를 불러오지 못했습니다.</p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-5 mt-7">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card h-36 bg-surface-subtle animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {filtered.length === 0 && !isError && (
              <p className="mt-6 text-sm text-center text-text-muted">
                {query ? '검색 결과가 없습니다.' : '등록된 문서가 없습니다.'}
              </p>
            )}
            <div className="grid grid-cols-2 gap-5 mt-7">
              {filtered.map((doc) => (
                <RagCard
                  key={doc.name}
                  title={doc.name}
                  fileType={doc.type ?? ''}
                  preview={doc.applied_at ? new Date(doc.applied_at).toLocaleDateString('ko-KR') : ''}
                  selected={selectedName === doc.name}
                  onClick={() => setSelectedName(doc.name)}
                />
              ))}
            </div>

            {hasNextPage && !query && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-6 py-2 rounded-full text-sm font-medium bg-surface border border-surface-border text-text-secondary hover:bg-surface-subtle disabled:opacity-50 transition-colors"
                >
                  {isFetchingNextPage ? '불러오는 중...' : '더 보기'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default RagPage
