import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import RagSearchInput from '../ui/components/rag/RagSearchInput'
import RagListItem from '../ui/components/rag/RagListItem'
import RagDetail from '../ui/components/rag/RagDetail'
import { RagListSkeleton } from '../ui/components/Skeleton'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useInfiniteDocuments } from '../hooks/useDocument'
import { pickDocuments } from '../api/services/document'
import { extractDomains, getDomainLabel } from '../utils/document'
import type { DocumentItem } from '../types/document'

// '전체' 탭만 프론트가 소유하는 값. 나머지 도메인 탭은 서버 데이터에서 파생한다.
const ALL = '__ALL__'

// 드로어 슬라이드 전환 시간(ms) — 닫힘 애니메이션 후 언마운트 타이밍과 맞춘다.
const DRAWER_MS = 320

const RagPage = () => {
  useDocumentTitle('Documents')
  const [query, setQuery] = useState('')
  const [activeDomain, setActiveDomain] = useState<string>(ALL)

  // selectedDoc: 드로어에 렌더할 문서(닫힘 애니메이션 동안 유지). drawerOpen: 슬라이드 상태.
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // 도메인 필터는 서버에 넘긴다(GET /documents?domain=HR). '전체'면 미지정.
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteDocuments(activeDomain === ALL ? undefined : activeDomain)

  const documents = useMemo(
    () => (data?.pages ?? []).flatMap((page) => pickDocuments(page.data.data)),
    [data],
  )

  // 도메인 탭 목록.
  // TODO(API): GET /capabilities 가 생기면 그 응답으로 교체한다(그때 이 훅 호출은 삭제).
  //            지금은 서버가 도메인 목록을 안 주므로, '전체' 문서 목록에서 domain을 모아 만든다.
  //            (도메인 필터 중엔 그 도메인 문서만 오므로, 탭은 항상 '전체' 쿼리 기준으로 뽑는다)
  const { data: allData } = useInfiniteDocuments(undefined)
  const domains = useMemo(
    () => extractDomains((allData?.pages ?? []).flatMap((p) => pickDocuments(p.data.data))),
    [allData],
  )

  // 이름 검색은 클라이언트에서(서버에 검색 파라미터가 없음).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return documents
    return documents.filter(
      (doc) =>
        doc.name.toLowerCase().includes(q) ||
        (doc.owning_department ?? '').toLowerCase().includes(q) ||
        (doc.type ?? '').toLowerCase().includes(q),
    )
  }, [documents, query])

  const openDoc = (doc: DocumentItem) => {
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

  // 무한 스크롤 센티넬
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage()
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const tabs = [ALL, ...domains]

  return (
    <div className="h-full w-full overflow-y-auto custom-scroll">
      <div className="max-w-5xl mx-auto px-8 py-12 animate-page-in">
        {/* 헤더: (좌) 제목 + 건수 / (우) 검색 */}
        <div className="flex items-center justify-between gap-6 mb-6">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-semibold text-text-primary">문서</h1>
            {!isLoading && !isError && (
              <span className="text-sm font-medium text-text-muted">{filtered.length}건</span>
            )}
          </div>
          <div className="w-full max-w-[300px] shrink-0">
            <RagSearchInput value={query} onChange={setQuery} placeholder="문서 검색..." compact />
          </div>
        </div>

        {/* 도메인 탭 — '전체' + 서버 데이터에서 파생된 도메인들 */}
        <div className="flex items-center gap-1 border-b border-surface-border overflow-x-auto scrollbar-hide">
          {tabs.map((domain) => (
            <button
              key={domain}
              type="button"
              onClick={() => setActiveDomain(domain)}
              className={`relative shrink-0 px-3 pb-2.5 text-[14px] font-medium transition-colors ${
                activeDomain === domain
                  ? 'text-[var(--color-brand)]'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {domain === ALL ? '전체' : getDomainLabel(domain)}
              {activeDomain === domain && (
                <span className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full bg-[var(--color-brand)]" />
              )}
            </button>
          ))}
        </div>

        {/* 리스트 */}
        {isLoading ? (
          <RagListSkeleton />
        ) : isError ? (
          <p className="mt-10 text-sm text-center text-text-muted">
            문서를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
          </p>
        ) : filtered.length === 0 ? (
          <p className="mt-10 text-sm text-center text-text-muted">
            {query ? '검색 결과가 없습니다.' : '등록된 문서가 없습니다.'}
          </p>
        ) : (
          <div className="flex flex-col mt-1">
            {filtered.map((doc, i) => (
              <RagListItem key={`${doc.name}-${i}`} doc={doc} onClick={() => openDoc(doc)} />
            ))}
          </div>
        )}

        {/* 무한 스크롤 센티넬 (검색 중엔 클라이언트 필터라 더 불러올 필요 없음) */}
        {!query && <div ref={sentinelRef} className="h-8" />}
        {isFetchingNextPage && (
          <p className="py-4 text-sm text-center text-text-muted">불러오는 중...</p>
        )}
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
