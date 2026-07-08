import { useState, useEffect, useMemo, useCallback } from 'react'
import RagSearchInput from '../ui/components/rag/RagSearchInput'
import RagListItem from '../ui/components/rag/RagListItem'
import RagDetail from '../ui/components/rag/RagDetail'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { MOCK_RAG_DOCS, type RagDoc } from '../mocks/ragDocuments'

// 카테고리 탭. 도메인이 아직 확정되지 않아 지금은 '전체'만 노출한다.
// 도메인이 정해지면 이 배열에 카테고리를 추가하고 아래 필터를 연결하면 된다.
const TABS = ['전체'] as const

// 드로어 슬라이드 전환 시간(ms) — 닫힘 애니메이션 후 언마운트 타이밍과 맞춘다.
const DRAWER_MS = 320

const RagPage = () => {
  useDocumentTitle('Documents')
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('전체')

  // selectedDoc: 드로어에 렌더할 문서(닫힘 애니메이션 동안 유지). drawerOpen: 슬라이드 상태.
  const [selectedDoc, setSelectedDoc] = useState<RagDoc | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // TODO(API): 목업(MOCK_RAG_DOCS)을 실제 문서 조회로 교체. 응답을 RagDoc 형태로 매핑.
  const allDocuments = MOCK_RAG_DOCS

  const filtered = useMemo(
    () =>
      allDocuments.filter((doc) => {
        const matchTab = activeTab === '전체' || doc.category === activeTab
        const matchQuery =
          doc.name.toLowerCase().includes(query.toLowerCase()) ||
          doc.description.toLowerCase().includes(query.toLowerCase())
        return matchTab && matchQuery
      }),
    [allDocuments, query, activeTab],
  )

  const openDoc = (doc: RagDoc) => {
    setSelectedDoc(doc)
    // 다음 프레임에 open → mount 직후 transform 전환이 걸려 슬라이드 인 된다.
    requestAnimationFrame(() => setDrawerOpen(true))
  }

  const closeDoc = useCallback(() => {
    setDrawerOpen(false)
    // 슬라이드 아웃이 끝난 뒤 언마운트.
    setTimeout(() => setSelectedDoc(null), DRAWER_MS)
  }, [])

  // 드로어 열림 동안 ESC 닫기 + 뒤 배경 스크롤 잠금
  useEffect(() => {
    if (!selectedDoc) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDoc() }
    window.addEventListener('keydown', onKey)
    document.body.classList.add('modal-open')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('modal-open')
    }
  }, [selectedDoc, closeDoc])

  return (
    <div className="h-full w-full overflow-y-auto custom-scroll">
      <div className="max-w-4xl mx-auto px-8 py-12 animate-page-in">
        {/* 헤더: 제목 + 건수 */}
        <div className="flex items-baseline gap-3 mb-5">
          <h1 className="text-2xl font-semibold text-text-primary">문서</h1>
          <span className="text-sm font-medium text-text-muted">{filtered.length}건</span>
        </div>

        <RagSearchInput value={query} onChange={setQuery} placeholder="문서 검색..." />

        {/* 카테고리 탭 (현재 '전체'만) */}
        <div className="flex items-center gap-1 mt-6 border-b border-surface-border">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`relative px-3 pb-2.5 text-[14px] font-medium transition-colors ${
                activeTab === tab ? 'text-[var(--color-brand)]' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full bg-[var(--color-brand)]" />
              )}
            </button>
          ))}
        </div>

        {/* 리스트 */}
        <div className="flex flex-col gap-2.5 mt-5">
          {filtered.length === 0 ? (
            <p className="mt-6 text-sm text-center text-text-muted">
              {query ? '검색 결과가 없습니다.' : '등록된 문서가 없습니다.'}
            </p>
          ) : (
            filtered.map((doc) => (
              <RagListItem key={doc.id} doc={doc} onClick={() => openDoc(doc)} />
            ))
          )}
        </div>
      </div>

      {/* 오른쪽 슬라이드 드로어 */}
      {selectedDoc && (
        <>
          {/* 배경 딤 */}
          <div
            onClick={closeDoc}
            className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
              drawerOpen ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {/* 패널 */}
          <aside
            className={`fixed right-0 top-0 z-50 h-full w-full max-w-md bg-surface shadow-[-24px_0_60px_rgba(40,30,35,0.14)] transition-transform duration-300 ease-[cubic-bezier(.6,.02,.2,1)] ${
              drawerOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            role="dialog"
            aria-modal="true"
          >
            <RagDetail doc={selectedDoc} onClose={closeDoc} />
          </aside>
        </>
      )}
    </div>
  )
}

export default RagPage
