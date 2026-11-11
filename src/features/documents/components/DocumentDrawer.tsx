import { useCallback } from 'react'
import Drawer from '@/shared/components/Drawer'
import RagDetail from './RagDetail'
import type { DocumentItem } from '../types'

export const DRAWER_MS = 320

interface DocumentDrawerProps {
  doc: DocumentItem | null
  open: boolean
  onClose: () => void
}

const DocumentDrawer = ({ doc, open, onClose }: DocumentDrawerProps) => {
  const handleClose = useCallback(() => onClose(), [onClose])

  if (!doc) return null

  return (
    <Drawer open={open} onClose={handleClose}>
      <RagDetail doc={doc} onClose={handleClose} />
    </Drawer>
  )
}

export default DocumentDrawer
