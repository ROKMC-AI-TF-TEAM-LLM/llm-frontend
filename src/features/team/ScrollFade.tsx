import { useEffect, useRef, useState } from 'react'

export default function ScrollFade({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [p, setP] = useState(reduce ? 1 : 0)

  useEffect(() => {
    const el = ref.current
    if (!el || reduce) return

    let raf = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const dist = Math.abs(r.top + r.height / 2 - vh / 2) / (vh / 2)
      const next = dist <= 0.55 ? 1 : Math.max(0, 1 - (dist - 0.55) / 0.5)
      setP(next)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [reduce])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: p,
        transform: `translateY(${(1 - p) * 26}px)`,
        transition: 'opacity .25s linear, transform .25s linear',
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}
