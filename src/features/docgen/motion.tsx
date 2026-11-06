// 문서 제작 화면 공통 움직임
import { useEffect, useState, type ReactNode } from 'react'

/** 배치·접기·나타나기에 쓰는 공통 전환 (움직임 줄이기 설정이면 끈다) */
export const MOTION = 'duration-500 ease-[cubic-bezier(.4,0,.2,1)] motion-reduce:transition-none'

/** 높이 0 ↔ 내용 높이로 부드럽게 접고 편다. 접혀 있는 동안은 읽기·포커스에서 빠진다 */
export function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div aria-hidden={!open} inert={!open} className={`grid transition-[grid-template-rows,opacity] ${MOTION} ${open ? 'opacity-100' : 'opacity-0'}`}
      style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  )
}

/** 처음 그려질 때 살짝 떠오르며 나타난다. key를 바꾸면 다시 재생된다 */
export function FadeIn({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <div className={`transition-[opacity,transform] ${MOTION} ${shown ? 'translate-y-0 opacity-100' : 'translate-y-1.5 opacity-0'}`}>
      {children}
    </div>
  )
}
