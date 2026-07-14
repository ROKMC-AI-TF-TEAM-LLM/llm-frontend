import { useState, useCallback, useRef, useEffect } from 'react'
import type { DocumentItem } from '../types/document'
import { DRAWER_MS } from '../ui/components/rag/DocumentDrawer'

/**
 * 문서 상세 드로어의 열기/닫기 상태.
 *
 * doc은 '닫힘 애니메이션이 끝날 때까지' 유지해야 슬라이드 아웃이 보인다.
 * 그래서 렌더 대상(doc)과 슬라이드 상태(open)를 분리해서 들고 있는다.
 */
export const useDocumentDrawer = () => {
  const [doc, setDoc] = useState<DocumentItem | null>(null)
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openDoc = useCallback((next: DocumentItem) => {
    // 닫는 중이었다면 언마운트 예약을 취소한다(빠르게 다시 열 때 깜빡임 방지).
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setDoc(next)
    // 다음 프레임에 open → mount 직후 transform 전환이 걸려 슬라이드 인 된다.
    requestAnimationFrame(() => setOpen(true))
  }, [])

  const closeDoc = useCallback(() => {
    setOpen(false)
    // 슬라이드 아웃이 끝난 뒤 언마운트.
    closeTimer.current = setTimeout(() => setDoc(null), DRAWER_MS)
  }, [])

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }, [])

  return { doc, open, openDoc, closeDoc }
}
