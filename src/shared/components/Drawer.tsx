import { useRef, type ReactNode } from 'react'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { useEscapeKey } from '../hooks/useEscapeKey'
import { useFocusTrap } from '../hooks/useFocusTrap'

interface DrawerProps {
  /** false면 화면 오른쪽 밖으로 밀려나 있다. 닫히는 애니메이션을 위해 닫힌 뒤에도 렌더링해 둔다 */
  open: boolean
  onClose: () => void
  children: ReactNode
}

/**
 * 오른쪽에서 밀려 나오는 서랍.
 * 배경 어둡게, ESC·바깥 클릭으로 닫기, 포커스 가두기, 뒤 화면 스크롤 잠금을 맡는다.
 */
export default function Drawer({ open, onClose, children }: DrawerProps) {
  const boxRef = useRef<HTMLElement>(null)
  useEscapeKey(onClose, open)
  useBodyScrollLock(open)
  useFocusTrap(boxRef, open)

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />
      <aside
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        inert={!open}
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md bg-surface shadow-[-24px_0_60px_rgba(40,30,35,0.14)] outline-none transition-transform duration-300 ease-[cubic-bezier(.6,.02,.2,1)] ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {children}
      </aside>
    </>
  )
}
