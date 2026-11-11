import { useRef, useState } from 'react'
import IconButton from '@/shared/components/IconButton'
import { useEscapeKey } from '@/shared/hooks/useEscapeKey'
import { useClickOutside } from '@/shared/hooks/useClickOutside'
import { EditIcon, MoreIcon, TrashIcon } from '@/shared/components/icons'
import MenuItem from '@/shared/components/MenuItem'

export function KebabMenu({
  onRename,
  onDelete,
}: {
  onRename?: () => void
  onDelete?: () => void
} = {}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useClickOutside(ref, () => setOpen(false), { enabled: open })
  useEscapeKey(() => setOpen(false), open)

  return (
    <div ref={ref} className="relative shrink-0">
      <IconButton label="더보기" onClick={() => setOpen((v) => !v)}>
        <MoreIcon className="h-4 w-4" />
      </IconButton>
      {open && (
        <div className="absolute left-0 top-[calc(100%+5px)] z-30 w-[158px] animate-fade-in overflow-hidden rounded-[12px] border border-rose-border bg-white p-1.5 shadow-[0_16px_40px_rgba(60,30,38,0.13)]">
          <MenuItem
            onClick={() => {
              setOpen(false)
              onRename?.()
            }}
          >
            <EditIcon className="h-3.5 w-3.5" strokeWidth={1.9} />
            이름 변경
          </MenuItem>
          <MenuItem
            danger
            onClick={() => {
              setOpen(false)
              onDelete?.()
            }}
          >
            <TrashIcon className="h-3.5 w-3.5" strokeWidth={1.9} />
            삭제
          </MenuItem>
        </div>
      )}
    </div>
  )
}
