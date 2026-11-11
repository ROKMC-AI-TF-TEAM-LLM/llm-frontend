import { useEffect } from 'react'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import LandingFooter from '../components/LandingFooter'
import PageNav from '../components/PageNav'
import {
  GuideHero,
  GuideSteps,
  GuideSmart,
  GuideTips,
  GuideFaq,
  GuideCta,
} from '../components/guide/sections'

// 각 구역은 data-guide-section을 달고 있다. '아래로 스크롤'은 다음 구역으로, 주소의 #id는 그 구역으로 이동한다.
export default function GuidePage() {
  useDocumentTitle('MARS 사용법')

  const HEADER_H = 66
  const scrollToSection = (id: string, smooth = true) => {
    const el = document.getElementById(id)
    if (!el) return
    window.scrollTo({
      top: Math.max(0, el.offsetTop - HEADER_H),
      behavior: smooth ? 'smooth' : 'auto',
    })
  }

  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (!id) return
    const raf = requestAnimationFrame(() => scrollToSection(id, false))
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const onHash = () => {
      const id = window.location.hash.slice(1)
      if (id) scrollToSection(id)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const scrollToNextSection = () => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('[data-guide-section]'),
    )
    if (!sections.length) return

    const probe = window.scrollY + 8
    let curIdx = 0
    sections.forEach((s, i) => {
      if (s.offsetTop <= probe) curIdx = i
    })

    const next = sections[curIdx + 1]
    const target = next ? next.offsetTop : document.body.scrollHeight
    window.scrollTo({ top: target, behavior: 'smooth' })
  }

  return (
    <div
      className="min-h-screen select-none"
      style={{
        color: '#1f1f22',
        background:
          'linear-gradient(180deg,#ffeef1 0%,#fdf3f5 9%,#ffffff 26%,#ffffff 100%)',
      }}
    >
      <style>{`
        @keyframes marsFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
        @keyframes marsSpin { to { transform: rotate(360deg); } }
        @keyframes faqIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }
        @keyframes blink { 0%,44% { opacity:1; } 50%,94% { opacity:0; } 100% { opacity:1; } }
        @keyframes lineIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:none; } }
        @keyframes hintIn { from { opacity:0; } to { opacity:1; } }
      `}</style>

      <PageNav current="guide" />
      <GuideHero onNext={scrollToNextSection} />
      <GuideSteps />
      <GuideSmart />
      <GuideTips />
      <GuideFaq />
      <GuideCta />

      <LandingFooter />
    </div>
  )
}
