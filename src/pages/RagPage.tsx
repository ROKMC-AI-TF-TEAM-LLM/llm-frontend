import { useState, useEffect } from 'react'
import RagSearchInput from '../ui/components/rag/RagSearchInput'
import RagCard from '../ui/components/rag/RagCard'
import { useInfiniteDocuments } from '../hooks/useDocument'
import type { DocumentItem } from '../types/document'

const RagPage = () => {
  const [query, setQuery] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null)

  const { data, isLoading, isError, error, hasNextPage, fetchNextPage, isFetchingNextPage, refetch, isRefetching } = useInfiniteDocuments()

  const allDocuments = data?.pages.flatMap((p) => p.data.data.documents) ?? []

  const filtered = allDocuments.filter((doc) =>
    doc.name.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    if (!selectedDoc) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedDoc(null) }
    window.addEventListener('keydown', onKey)
    document.body.classList.add('modal-open')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('modal-open')
    }
  }, [selectedDoc])

  return (
    <div className="min-h-full w-full" onClick={() => setSelectedDoc(null)}>

      {selectedDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setSelectedDoc(null)}
        >
          <div
            className="bg-surface rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-surface-border">
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-surface-border text-text-secondary">
                {selectedDoc.type ?? '-'}
              </span>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-text-muted hover:text-text-primary transition-colors"
                aria-label="닫기"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div>
                <p className="text-xs font-medium text-text-muted mb-1.5">문서 이름</p>
                <p className="text-sm font-semibold text-text-primary break-all leading-relaxed">
                  {selectedDoc.name}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-text-muted mb-1.5">문서 요약</p>
                <p className="text-sm text-text-secondary leading-relaxed">요약 정보가 없습니다.</p>
              </div>
              <div>
                <p className="text-xs font-medium text-text-muted mb-1.5">등록일</p>
                <p className="text-sm text-text-secondary">
                  {selectedDoc.applied_at
                    ? new Date(selectedDoc.applied_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-8 py-12">
        <h1 className="text-2xl font-semibold text-text-primary mb-5">문서</h1>
        <RagSearchInput value={query} onChange={setQuery} placeholder="문서 검색..." />

        {isError && (() => {
          const code = (error as { response?: { data?: { error?: { code?: string } } } })?.response?.data?.error?.code
          const msg = code === 'LLM_SERVER_ERROR'
            ? 'LLM 서버에 연결할 수 없습니다. 백엔드 서버 상태를 확인해주세요.'
            : code === 'UNAUTHORIZED' || code === 'TOKEN_INVALID'
            ? '인증이 만료되었습니다. 다시 로그인해주세요.'
            : '문서를 불러오지 못했습니다.'
          return (
            <div className="mt-6 flex flex-col items-center gap-3">
              <p className="text-sm text-center text-text-muted">{msg}</p>
              <button
                onClick={() => refetch()}
                disabled={isRefetching}
                className="px-4 py-1.5 rounded-full text-xs font-medium bg-surface border border-surface-border text-text-secondary hover:bg-surface-subtle disabled:opacity-50 transition-colors"
              >
                {isRefetching ? '재시도 중...' : '다시 시도'}
              </button>
            </div>
          )
        })()}

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
                  key={`${doc.name}|${doc.type ?? ''}|${doc.applied_at ?? ''}`}
                  title={doc.name}
                  fileType={doc.type ?? ''}
                  preview={doc.applied_at ? new Date(doc.applied_at).toLocaleDateString('ko-KR') : ''}
                  selected={selectedDoc?.name === doc.name}
                  onClick={() => setSelectedDoc(doc)}
                />
              ))}
            </div>

            {hasNextPage && !query && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={(e) => { e.stopPropagation(); fetchNextPage() }}
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
