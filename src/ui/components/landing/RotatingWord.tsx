import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * 헤드라인 끝 단어가 일정 간격으로 바뀌는 효과.
 * (Grok 홈페이지의 "everything you see. / code. / write." 연출)
 *
 * 단어마다 길이가 달라 밑줄과 뒷 문장이 흔들리기 쉬우므로,
 * 가장 긴 단어를 숨겨 깔아 폭을 미리 확보한 뒤 그 위에 실제 단어를 겹쳐 그린다.
 * → 폭이 고정되어 레이아웃이 요동치지 않는다.
 */
export default function RotatingWord({
  words,
  interval = 2600,
  className = '',
}: {
  words: string[]
  /** 한 단어가 머무는 시간(ms) */
  interval?: number
  className?: string
}) {
  const [idx, setIdx] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const rootRef = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState(false)

  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  // 폭 기준이 될 가장 긴 단어
  const longest = useMemo(
    () => words.reduce((a, b) => (b.length > a.length ? b : a), words[0] ?? ''),
    [words],
  )

  // 화면 밖이면 타이머를 돌리지 않는다.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (reduced || !active || words.length <= 1) return
    // 나가는 애니메이션(260ms) → 단어 교체 → 들어오는 애니메이션
    const out = setTimeout(() => setLeaving(true), interval - 260)
    const swap = setTimeout(() => {
      setIdx((i) => (i + 1) % words.length)
      setLeaving(false)
    }, interval)
    return () => {
      clearTimeout(out)
      clearTimeout(swap)
    }
  }, [idx, interval, words.length, reduced, active])

  return (
    <span ref={rootRef} className={`mars-rotword ${className}`}>
      {/* 폭 확보용 — 보이지 않지만 자리를 차지한다 */}
      <span className="mars-rotword-ghost" aria-hidden>
        {longest}
      </span>
      <span
        key={idx}
        className={`mars-rotword-live ${leaving ? 'is-leaving' : 'is-entering'}`}
        // 단어가 계속 바뀌므로 스크린리더가 매번 읽지 않도록 정적으로 처리
        aria-live="off"
      >
        {words[idx]}
      </span>
      <span className="mars-rotword-underline" aria-hidden />
    </span>
  )
}
