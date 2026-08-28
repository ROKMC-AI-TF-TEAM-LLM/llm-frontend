import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Tutorial } from './tutorials'

export function TutorialHeader() {
  const navigate = useNavigate()
  return (
    <header
      style={{ padding: '14px clamp(20px, 6vw, 64px)' }}
      className="sticky top-0 z-30 flex items-center border-b border-[#f4eced] bg-white/70 backdrop-blur-md"
    >
      <button onClick={() => navigate('/')} className="mars-nav-brand">
        MARS
      </button>
      <button
        type="button"
        onClick={() => navigate('/')}
        style={{ background: 'var(--color-brand)' }}
        className="ml-auto rounded-[6px] px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-[var(--color-brand-hover)]"
      >
        시작하기
      </button>
    </header>
  )
}

export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.unobserve(el)
        }
      },
      { threshold: 0.12 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : 'translateY(18px)',
        transition: `opacity .6s cubic-bezier(.2,.7,.2,1) ${delay}ms, transform .6s cubic-bezier(.2,.7,.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

export function TutorialCard({ tutorial, onOpen }: { tutorial: Tutorial; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="tut-card group flex flex-col overflow-hidden rounded-[16px] border border-[#f0e6e8] bg-white text-left"
    >
      <span
        className="tut-thumb relative flex items-center justify-center overflow-hidden"
        style={{ background: tutorial.tint, aspectRatio: '16 / 9' }}
      >
        <span className="tut-thumb-light absolute inset-0" aria-hidden />

        <span className="tut-play relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white/95 shadow-[0_4px_16px_rgba(60,20,30,0.16)]">
          <svg className="ml-0.5 h-5 w-5 text-brand" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        </span>
      </span>

      <span className="flex flex-1 flex-col p-5">
        <span className="text-[16.5px] font-bold leading-[1.35] tracking-[-0.01em] text-text-primary mars-brand-serif break-keep">
          {tutorial.title}
        </span>
        <span className="mt-2.5 line-clamp-2 text-[13px] leading-[1.7] text-text-secondary break-keep">
          {tutorial.summary}
        </span>

        <span className="mt-auto flex items-center gap-2 border-t border-[#f7f0f1] pt-4 text-[12px] font-medium text-text-muted">
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: tutorial.tint }} />
          {tutorial.category}
          <span className="tut-arrow ml-auto text-text-hint">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </span>
        </span>
      </span>
    </button>
  )
}
