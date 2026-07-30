import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Tutorial } from './tutorials'

// 튜토리얼 페이지들이 공유하는 조각. 톤은 MARS(빨강/흰색)를 유지하고,
// 구조와 여백은 클로드 튜토리얼 페이지를 참고했다.

/** 상단 바 — 랜딩 네비와 같은 계열(워드마크 + 얇은 시작하기). */
export function TutorialHeader() {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-30 flex items-center border-b border-[#f4eced] bg-white/90 px-[6vw] py-3.5 backdrop-blur-md">
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

/**
 * 스크롤해서 화면에 들어올 때 아래에서 살짝 올라오며 나타난다.
 * 한 번 보이면 관찰을 끊어(unobserve) 다시 움직이지 않게 한다 — 오르내릴 때마다
 * 흔들리면 산만하다. delay로 카드들이 차례로 올라오게 만든다.
 */
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

/**
 * 튜토리얼 카드 — 위에 색면 썸네일, 아래에 제목·설명.
 * 호버하면 카드가 살짝 떠오르고 썸네일 안의 재생 표시가 커진다.
 */
export function TutorialCard({ tutorial, onOpen }: { tutorial: Tutorial; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="tut-card group flex flex-col overflow-hidden rounded-[16px] border border-[#f0e6e8] bg-white text-left"
    >
      {/* 썸네일 — 영상이 없어도 목록이 심심하지 않게 색면 + 재생 표시 */}
      <span
        className="relative flex items-center justify-center overflow-hidden"
        style={{ background: tutorial.tint, aspectRatio: '16 / 9' }}
      >
        <span className="tut-play flex h-12 w-12 items-center justify-center rounded-full bg-white/85">
          <svg className="ml-0.5 h-5 w-5 text-brand" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        </span>
      </span>

      <span className="flex flex-1 flex-col p-5">
        <span className="text-[16.5px] font-bold leading-[1.35] tracking-[-0.01em] text-text-primary break-keep">
          {tutorial.title}
        </span>
        <span className="mt-2.5 line-clamp-2 text-[13px] leading-[1.7] text-text-secondary break-keep">
          {tutorial.summary}
        </span>
        <span className="mt-auto flex items-center gap-1.5 pt-5 text-[12px] font-medium text-text-muted">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-soft" />
          {tutorial.category}
        </span>
      </span>
    </button>
  )
}
