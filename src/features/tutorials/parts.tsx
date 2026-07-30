import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Tutorial } from './tutorials'

// 튜토리얼 페이지들이 공유하는 조각. 톤은 MARS(빨강/흰색)를 유지하고,
// 구조와 여백은 클로드 튜토리얼 페이지를 참고했다.

/** 상단 바 — 랜딩 네비와 같은 계열(워드마크 + 얇은 시작하기). */
export function TutorialHeader() {
  const navigate = useNavigate()
  // 배경이 옅게 깔려 있어 흰 판으로 두면 경계가 진다 → 반투명 + blur로 비치게 한다.
  return (
    <header className="sticky top-0 z-30 flex items-center border-b border-[#f4eced] bg-white/70 px-[6vw] py-3.5 backdrop-blur-md">
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
 * 썸네일 안에 얹는 화면 미니어처.
 * 튜토리얼마다 그 기능의 실제 화면을 아주 단순하게 줄여 그린다 —
 * 스크린샷을 쓰면 관리가 번거롭고 폐쇄망에서 파일만 늘어나므로 도형으로 흉내 낸다.
 */
function ThumbPreview({ slug }: { slug: string }) {
  // 공통 : 아래가 잘린 흰 카드(= 화면 일부가 보이는 느낌)
  const shell =
    'w-full rounded-t-[10px] bg-white/95 px-3 pt-3 shadow-[0_-1px_14px_rgba(60,20,30,0.10)]'

  if (slug === 'domains') {
    // 도메인 : 분야 칩이 늘어선 모습, 하나만 선택됨
    return (
      <span className={`${shell} pb-3`}>
        <span className="flex flex-wrap gap-1">
          {['인사·복지', '정보화·보안', '교범'].map((d, i) => (
            <span
              key={d}
              className={`rounded-full px-2 py-[3px] text-[7.5px] font-semibold ${
                i === 0 ? 'bg-brand text-white' : 'bg-[#f4eced] text-[#b3a7ab]'
              }`}
            >
              {d}
            </span>
          ))}
        </span>
        <span className="mt-2 block h-[7px] w-[78%] rounded-full bg-[#efe7e9]" />
        <span className="mt-1.5 block h-[7px] w-[54%] rounded-full bg-[#f4eff0]" />
      </span>
    )
  }

  if (slug === 'sources') {
    // 출처 : 답변 아래 붙는 출처 배지
    return (
      <span className={`${shell} pb-3`}>
        <span className="block h-[7px] w-[86%] rounded-full bg-[#efe7e9]" />
        <span className="mt-1.5 block h-[7px] w-[62%] rounded-full bg-[#f4eff0]" />
        <span className="mt-2.5 flex items-center gap-1 rounded-[6px] border border-brand-soft bg-brand-subtle px-1.5 py-1">
          <span className="h-[9px] w-[9px] shrink-0 rounded-[3px] bg-brand" />
          <span className="h-[5px] w-[46%] rounded-full bg-[#f0cdd6]" />
        </span>
      </span>
    )
  }

  if (slug === 'documents') {
    // 문서 검색 : 검색창 + 문서 목록
    return (
      <span className={`${shell} pb-3`}>
        <span className="flex items-center gap-1.5 rounded-full border border-[#f0e6e8] px-2 py-1">
          <span className="h-[7px] w-[7px] rounded-full border-[1.5px] border-[#d9c8cd]" />
          <span className="h-[5px] w-[40%] rounded-full bg-[#efe7e9]" />
        </span>
        {[86, 68, 76].map((w, i) => (
          <span key={i} className="mt-1.5 flex items-center gap-1.5">
            <span className="h-[9px] w-[7px] shrink-0 rounded-[2px] bg-[#f0cdd6]" />
            <span className="h-[6px] rounded-full bg-[#f1ebec]" style={{ width: `${w}%` }} />
          </span>
        ))}
      </span>
    )
  }

  // 프로젝트 : 왼쪽 사이드 + 지침 블록
  return (
    <span className={`${shell} flex gap-2 pb-3`}>
      <span className="flex w-[26%] shrink-0 flex-col gap-1">
        {[1, 0.7, 0.85].map((w, i) => (
          <span
            key={i}
            className={`h-[6px] rounded-full ${i === 0 ? 'bg-[#f0cdd6]' : 'bg-[#f1ebec]'}`}
            style={{ width: `${w * 100}%` }}
          />
        ))}
      </span>
      <span className="flex-1 rounded-[6px] border border-[#f4eced] p-1.5">
        <span className="block h-[5px] w-[38%] rounded-full bg-[#f0cdd6]" />
        <span className="mt-1.5 block h-[5px] w-[88%] rounded-full bg-[#f1ebec]" />
        <span className="mt-1 block h-[5px] w-[70%] rounded-full bg-[#f4eff0]" />
      </span>
    </span>
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
      {/* 썸네일 — 색면 위에 화면 미니어처를 얹는다(클로드 튜토리얼 카드와 같은 방식).
          무슨 내용인지 카드만 봐도 짐작되게 하는 게 목적이라, 장식이 아니라 '미리보기'다. */}
      <span
        className="tut-thumb relative flex items-end justify-center overflow-hidden px-6 pt-7"
        style={{ background: tutorial.tint, aspectRatio: '16 / 9' }}
      >
        <span className="tut-thumb-light absolute inset-0" aria-hidden />
        <ThumbPreview slug={tutorial.slug} />

        {/* 재생 표시 — 미니어처 위에 겹쳐 영상임을 알린다 */}
        <span className="tut-play absolute flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white/95 shadow-[0_4px_16px_rgba(60,20,30,0.16)]">
          <svg className="ml-0.5 h-[18px] w-[18px] text-brand" viewBox="0 0 24 24" fill="currentColor">
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

        {/* 아래 줄 — 분류와 화살표. 구분선을 둬 카드 안이 정돈돼 보이게 한다. */}
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
