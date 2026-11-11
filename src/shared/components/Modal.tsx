import { useRef, type ReactNode } from 'react'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { useEscapeKey } from '../hooks/useEscapeKey'
import { useFocusTrap } from '../hooks/useFocusTrap'

const BACKDROP = {
  /** 옅게 어두워지며 나타난다 (프로젝트 모달) */
  dim: {
    container: 'p-6',
    overlay: 'animate-fade-in bg-[rgba(26,25,23,0.28)]',
  },
  /** 어둡고 흐리게 (관리자 모달) */
  blur: { container: '', overlay: 'bg-black/40 backdrop-blur-sm' },
}

interface ModalProps {
  onClose: () => void
  backdrop?: keyof typeof BACKDROP
  /** 상자의 모양(너비·모서리·바탕·그림자·등장 애니메이션). 위치와 닫기 동작은 Modal이 맡는다 */
  className?: string
  children: ReactNode
}

/**
 * 화면 가운데 뜨는 대화상자. 떠 있을 때만 렌더링한다(`{open && <Modal …>}`).
 * 배경 어둡게, ESC·바깥 클릭으로 닫기, 포커스 가두기, 뒤 화면 스크롤 잠금을 맡는다.
 */
export default function Modal({
  onClose,
  backdrop = 'dim',
  className = '',
  children,
}: ModalProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  useEscapeKey(onClose)
  useBodyScrollLock()
  useFocusTrap(boxRef)

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${BACKDROP[backdrop].container}`}
    >
      <div
        className={`absolute inset-0 ${BACKDROP[backdrop].overlay}`}
        onClick={onClose}
      />
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={`relative z-10 outline-none ${className}`}
      >
        {children}
      </div>
    </div>
  )
}
