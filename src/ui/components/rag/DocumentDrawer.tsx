import { useEffect, useCallback } from 'react'
import RagDetail from './RagDetail'
import type { DocumentItem } from '../../../types/document'

// 드로어 슬라이드 전환 시간(ms) — 닫힘 애니메이션 후 언마운트 타이밍과 맞춘다.
export const DRAWER_MS = 320

interface DocumentDrawerProps {
  /** 렌더할 문서. null이면 아무것도 그리지 않는다. */
  doc: DocumentItem | null
  /** 슬라이드 인/아웃 상태. mount 직후 true로 바꿔야 전환이 걸린다. */
  open: boolean
  onClose: () => void
}

/**
 * 오른쪽에서 슬라이드되는 문서 상세 드로어.
 * 문서 페이지(RagPage)와 채팅 출처(SourceBadge) 양쪽에서 재사용한다.
 */
const DocumentDrawer = ({ doc, open, onClose }: DocumentDrawerProps) => {
  const handleClose = useCallback(() => onClose(), [onClose])

  // 열림 동안 ESC 닫기 + 뒤 배경 스크롤 잠금
  useEffect(() => {
    if (!doc) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.classList.add('modal-open')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('modal-open')
    }
  }, [doc, handleClose])

  if (!doc) return null

  return (
    <>
      {/* 배경 딤 */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {/* 패널 */}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md bg-surface shadow-[-24px_0_60px_rgba(40,30,35,0.14)] transition-transform duration-300 ease-[cubic-bezier(.6,.02,.2,1)] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        <RagDetail doc={doc} onClose={handleClose} />
      </aside>
    </>
  )
}

export default DocumentDrawer
