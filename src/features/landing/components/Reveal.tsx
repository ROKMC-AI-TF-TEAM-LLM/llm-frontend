import { useRef } from 'react'
import { useInView } from '@/shared/hooks/useInView'

const EASE = 'cubic-bezier(.2,.7,.2,1)'

// soft: 튜토리얼 화면(짧게 떠오름). deep: 이용 안내 화면(더 멀리서, 흐릿하게 시작)
const VARIANTS = {
  soft: {
    hidden: { transform: 'translateY(18px)' },
    transition: `opacity .6s ${EASE}, transform .6s ${EASE}`,
    rootMargin: undefined,
  },
  deep: {
    hidden: { transform: 'translateY(28px)', filter: 'blur(4px)' },
    transition: `opacity .85s ${EASE}, transform .85s ${EASE}, filter .85s ${EASE}`,
    rootMargin: '0px 0px -8% 0px',
  },
}

/** 화면에 들어오면 아래에서 떠오르며 나타난다 */
export function Reveal({
  children,
  delay = 0,
  className = '',
  variant = 'soft',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  variant?: keyof typeof VARIANTS
}) {
  const ref = useRef<HTMLDivElement>(null)
  const v = VARIANTS[variant]
  const shown = useInView(ref, { rootMargin: v.rootMargin })

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        ...(shown ? { transform: 'none', filter: 'none' } : v.hidden),
        transition: v.transition,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
