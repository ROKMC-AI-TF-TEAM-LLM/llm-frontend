import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GUIDE_SECTIONS, type GuideSection } from './guideSections'
import NavPreview from './NavPreview'

/**
 * 랜딩 상단 네비게이션.
 *
 * "서비스 이용법"에 마우스를 올리면 가이드 섹션 목록이 부드럽게 펼쳐지고,
 * 항목을 누르면 가이드 페이지의 해당 섹션으로 바로 이동한다(/guide#step-01).
 *
 * 호버로 열되 마우스가 잠깐 메뉴 밖을 스쳐도 닫히지 않도록 닫힘에만 지연을 둔다
 * (트리거와 패널 사이 간격을 지날 때 깜빡이며 닫히는 걸 막는다).
 */
export default function LandingNav({ onStart }: { onStart: () => void }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  // 오른쪽 미리보기가 따라갈 대상 — 기본은 첫 단계
  const [hovered, setHovered] = useState(GUIDE_SECTIONS[0].id)
  const closeTimer = useRef<number | undefined>(undefined)
  const wrapRef = useRef<HTMLDivElement>(null)
  // CTA 오른쪽 캐럿으로 여는 짧은 메뉴 (본문 드롭다운과 독립)
  const [ctaOpen, setCtaOpen] = useState(false)
  const ctaTimer = useRef<number | undefined>(undefined)

  const cancelCtaClose = () => {
    if (ctaTimer.current !== undefined) {
      clearTimeout(ctaTimer.current)
      ctaTimer.current = undefined
    }
  }
  const closeCtaSoon = () => {
    cancelCtaClose()
    ctaTimer.current = window.setTimeout(() => setCtaOpen(false), 160)
  }
  useEffect(() => cancelCtaClose, [])

  // 스크롤하면 바에 흰 배경을 덮는다(본문이 바 아래를 지나며 글자가 겹치는 걸 막는다).
  // 랜딩은 window가 아니라 .mars-intro 안에서 스크롤되므로 그 요소를 관찰한다.
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const scroller = document.querySelector('.mars-intro')
    const target: HTMLElement | Window = scroller instanceof HTMLElement ? scroller : window
    const read = () =>
      target === window ? window.scrollY : (target as HTMLElement).scrollTop
    const onScroll = () => setScrolled(read() > 8)
    onScroll()
    target.addEventListener('scroll', onScroll, { passive: true })
    return () => target.removeEventListener('scroll', onScroll)
  }, [])

  const cancelClose = () => {
    if (closeTimer.current !== undefined) {
      clearTimeout(closeTimer.current)
      closeTimer.current = undefined
    }
  }
  const openNow = () => {
    cancelClose()
    setOpen(true)
  }
  const closeSoon = () => {
    cancelClose()
    closeTimer.current = window.setTimeout(() => setOpen(false), 160)
  }

  useEffect(() => cancelClose, [])

  // Esc로 닫기 — 키보드 사용자를 위한 탈출구
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const go = (id: string) => {
    setOpen(false)
    navigate(`/guide#${id}`)
  }

  return (
    <header className={`mars-nav ${scrolled ? 'is-scrolled' : ''}`}>
      <button type="button" onClick={() => navigate('/')} className="mars-nav-brand">
        MARS
      </button>

      <nav className="mars-nav-links">
        {/* 서비스 이용법 : 호버 시 섹션 목록이 펼쳐진다 */}
        <div
          ref={wrapRef}
          className="mars-nav-item"
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
        >
          <button
            type="button"
            className={`mars-nav-trigger ${open ? 'is-open' : ''}`}
            aria-expanded={open}
            aria-haspopup="true"
            onClick={() => (open ? go('step-01') : setOpen(true))}
          >
            서비스 이용법
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="mars-nav-caret"><path d="m6 9 6 6 6-6" /></svg>
          </button>

          <div className={`mars-nav-panel ${open ? 'is-open' : ''}`} role="menu">
            <div className="mars-nav-panel-inner">
              <div className="mars-nav-col">
                <div className="mars-nav-colhead">단계별 사용법</div>
                {GUIDE_SECTIONS.map((s, i) => (
                  <MenuRow
                    key={s.id}
                    section={s}
                    index={i + 1}
                    active={hovered === s.id}
                    onHover={() => setHovered(s.id)}
                    onSelect={go}
                  />
                ))}
              </div>
              {/* 오른쪽 : 왼쪽에서 가리킨 단계의 동작을 미리 보여준다 */}
              <div className="mars-nav-preview">
                <NavPreview key={hovered} sectionId={hovered} />
              </div>
            </div>
          </div>
        </div>

        <button type="button" onClick={() => navigate('/tutorials')} className="mars-nav-trigger">
          튜토리얼
        </button>

        <button type="button" onClick={() => window.open('https://channel.io/ko/team', '_blank')} className="mars-nav-trigger">
          팀 소개
        </button>
      </nav>

      {/* CTA : 각진 검정 버튼 + 분리된 드롭다운 칸.
          캐럿을 누르면 가이드/팀 소개로 갈 수 있는 짧은 메뉴가 열린다. */}
      <div className="mars-nav-actions">
        <div
          className="mars-nav-item"
          onMouseEnter={cancelCtaClose}
          onMouseLeave={closeCtaSoon}
        >
          <div className="mars-nav-cta-group">
            <button type="button" onClick={onStart} className="mars-nav-cta-main">
              시작하기
            </button>
            <button
              type="button"
              className="mars-nav-cta-caret"
              aria-label="더 보기"
              aria-expanded={ctaOpen}
              aria-haspopup="true"
              onClick={() => setCtaOpen((v) => !v)}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mars-nav-caret"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>

          <div className={`mars-nav-panel mars-nav-panel-sm ${ctaOpen ? 'is-open' : ''}`} role="menu">
            <div className="mars-nav-panel-inner">
              <div className="mars-nav-col mars-nav-col-sm">
                <button
                  type="button"
                  role="menuitem"
                  className="mars-nav-row"
                  onClick={() => {
                    setCtaOpen(false)
                    go('step-01')
                  }}
                >
                  <span className="mars-nav-rowbody">
                    <span className="mars-nav-rowlabel">서비스 이용법</span>
                    <span className="mars-nav-rowdesc">처음이라면 단계별 사용법부터</span>
                  </span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="mars-nav-row"
                  onClick={() => {
                    setCtaOpen(false)
                    onStart()
                  }}
                >
                  <span className="mars-nav-rowbody">
                    <span className="mars-nav-rowlabel">로그인</span>
                    <span className="mars-nav-rowdesc">계정으로 바로 들어가기</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function MenuRow({
  section,
  index,
  active,
  onHover,
  onSelect,
}: {
  section: GuideSection
  index?: number
  /** 오른쪽 미리보기가 이 항목을 비추고 있는지 */
  active?: boolean
  onHover?: () => void
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={`mars-nav-row ${active ? 'is-active' : ''}`}
      onMouseEnter={onHover}
      onFocus={onHover}
      onClick={() => onSelect(section.id)}
    >
      {index !== undefined && <span className="mars-nav-rownum">0{index}</span>}
      <span className="mars-nav-rowbody">
        <span className="mars-nav-rowlabel">{section.label}</span>
        <span className="mars-nav-rowdesc">{section.desc}</span>
      </span>
      <svg className="mars-nav-rowarrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    </button>
  )
}
