import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GUIDE_SECTIONS, type GuideSection } from './guideSections'
import NavPreview from './NavPreview'
import { showDevToast } from '../DevToast'

export default function LandingNav({ onStart }: { onStart: () => void }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(GUIDE_SECTIONS[0].id)
  const closeTimer = useRef<number | undefined>(undefined)
  const wrapRef = useRef<HTMLDivElement>(null)
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

  const goGuideTop = () => {
    setOpen(false)
    navigate('/guide')
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  return (
    <header className={`mars-nav ${scrolled ? 'is-scrolled' : ''}`}>
      <button type="button" onClick={() => navigate('/')} className="mars-nav-brand">
        <span className="mars-brand-serif mars-nav-brand-text">MARS</span>
      </button>

      <nav className="mars-nav-links">
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
            onClick={() => (open ? goGuideTop() : setOpen(true))}
          >
            서비스 이용법
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="mars-nav-caret"><path d="m6 9 6 6 6-6" /></svg>
          </button>

          <div className={`mars-nav-panel ${open ? 'is-open' : ''}`} role="menu">
            <div className="mars-nav-panel-inner">
              <div className="mars-nav-col">
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
              <div className="mars-nav-preview">
                <NavPreview key={hovered} sectionId={hovered} />
              </div>
            </div>
          </div>
        </div>

        <button type="button" onClick={() => navigate('/tutorials')} className="mars-nav-trigger">
          튜토리얼
        </button>

        <button type="button" onClick={() => showDevToast('개발 중인 페이지입니다.')} className="mars-nav-trigger">
          팀 소개
        </button>
      </nav>

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
                    goGuideTop()
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
