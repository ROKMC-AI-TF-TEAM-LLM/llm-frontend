import { useEffect, useCallback } from 'react'
import RagDetail from './RagDetail'
import type { DocumentItem } from '../../../types/document'

export const DRAWER_MS = 320

interface DocumentDrawerProps {
  doc: DocumentItem | null
  open: boolean
  onClose: () => void
}

const DocumentDrawer = ({ doc, open, onClose }: DocumentDrawerProps) => {
  const handleClose = useCallback(() => onClose(), [onClose])

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
      <div
        onClick={handleClose}
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />
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
