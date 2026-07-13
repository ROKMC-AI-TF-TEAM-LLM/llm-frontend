import { useState, useEffect, useMemo, useCallback } from 'react'
import RagSearchInput from '../ui/components/rag/RagSearchInput'
import RagListItem from '../ui/components/rag/RagListItem'
import RagDetail from '../ui/components/rag/RagDetail'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { MOCK_RAG_DOCS, extractDomains, type RagDoc } from '../mocks/ragDocuments'

// '전체' 탭만 프론트가 소유하는 값. 나머지 도메인 탭은 전부 서버 데이터에서 파생한다.
// (도메인 목록을 프론트에 하드코딩하지 않는다 — 언제든 추가·변경될 수 있으므로)
// 탭은 코드(HR)로 필터하고, 화면에는 서버가 준 한글 라벨(인사·복지)을 표시한다.
const ALL = '__ALL__'

// 드로어 슬라이드 전환 시간(ms) — 닫힘 애니메이션 후 언마운트 타이밍과 맞춘다.
const DRAWER_MS = 320

const RagPage = () => {
  useDocumentTitle('Documents')
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<string>(ALL)

  // selectedDoc: 드로어에 렌더할 문서(닫힘 애니메이션 동안 유지). drawerOpen: 슬라이드 상태.
  const [selectedDoc, setSelectedDoc] = useState<RagDoc | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // TODO(API): 목업(MOCK_RAG_DOCS)을 실제 문서 조회로 교체. 응답을 RagDoc 형태로 매핑.
  //            백엔드 도메인 필드명(domain/category)이 확정되면 매핑 시 doc.category에 넣어주면
  //            아래 코드는 손댈 필요가 없다.
  const allDocuments = MOCK_RAG_DOCS

  // 탭 = [전체, ...서버 데이터에 실제로 존재하는 도메인(코드+라벨)]
  const tabs = useMemo(
    () => [{ code: ALL, label: '전체' }, ...extractDomains(allDocuments)],
    [allDocuments],
  )

  const filtered = useMemo(
    () =>
      allDocuments.filter((doc) => {
        const matchTab = activeTab === ALL || doc.category === activeTab
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
      <div className="max-w-5xl mx-auto px-8 py-12 animate-page-in">
        {/* 헤더: (좌) 제목 + 건수  /  (우) 검색 */}
        <div className="flex items-center justify-between gap-6 mb-6">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-semibold text-text-primary">문서</h1>
            <span className="text-sm font-medium text-text-muted">{filtered.length}건</span>
          </div>
          <div className="w-full max-w-[300px] shrink-0">
            <RagSearchInput value={query} onChange={setQuery} placeholder="문서 검색..." compact />
          </div>
        </div>

        {/* 도메인 탭 — '전체' + 서버 데이터에서 파생된 도메인들 */}
        <div className="flex items-center gap-1 border-b border-surface-border overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.code}
              type="button"
              onClick={() => setActiveTab(tab.code)}
              className={`relative shrink-0 px-3 pb-2.5 text-[14px] font-medium transition-colors ${
                activeTab === tab.code ? 'text-[var(--color-brand)]' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab.label}
              {activeTab === tab.code && (
                <span className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full bg-[var(--color-brand)]" />
              )}
            </button>
          ))}
        </div>

        {/* 리스트 — 카드가 아니라 구분선으로 이어지는 평평한 행 */}
        <div className="flex flex-col mt-1">
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
