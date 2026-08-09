import { useState, useCallback, useRef, useEffect } from 'react'
import type { DocumentItem } from '../types/document'
import { DRAWER_MS } from '../ui/components/rag/DocumentDrawer'

export const useDocumentDrawer = () => {
  const [doc, setDoc] = useState<DocumentItem | null>(null)
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openDoc = useCallback((next: DocumentItem) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setDoc(next)
    requestAnimationFrame(() => setOpen(true))
  }, [])

  const closeDoc = useCallback(() => {
    setOpen(false)
    closeTimer.current = setTimeout(() => setDoc(null), DRAWER_MS)
  }, [])

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }, [])

  return { doc, open, openDoc, closeDoc }
}
