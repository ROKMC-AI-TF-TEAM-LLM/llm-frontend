import { useEffect, useMemo, useRef, useState } from 'react'

export default function RotatingWord({
  words,
  interval = 2600,
  className = '',
}: {
  words: string[]
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

  const longest = useMemo(
    () => words.reduce((a, b) => (b.length > a.length ? b : a), words[0] ?? ''),
    [words],
  )

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (reduced || !active || words.length <= 1) return
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
      <span className="mars-rotword-ghost" aria-hidden>
        {longest}
      </span>
      <span
        key={idx}
        className={`mars-rotword-live ${leaving ? 'is-leaving' : 'is-entering'}`}
        aria-live="off"
      >
        {words[idx]}
      </span>
      <span className="mars-rotword-underline" aria-hidden />
    </span>
  )
}
