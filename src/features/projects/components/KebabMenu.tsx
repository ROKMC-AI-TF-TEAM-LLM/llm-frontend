import { useRef, useState } from 'react'
import IconButton from '@/shared/components/IconButton'
import { useEscapeKey } from '@/shared/hooks/useEscapeKey'
import { useClickOutside } from '@/shared/hooks/useClickOutside'
import { EditIcon, MoreIcon, TrashIcon } from '@/shared/components/icons'

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
        <div
          className="absolute left-0 top-[calc(100%+5px)] z-30 w-[158px] animate-fade-in overflow-hidden rounded-[12px] border border-rose-border bg-white p-1.5 shadow-[0_16px_40px_rgba(60,30,38,0.13)]"
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onRename?.()
            }}
            className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-13 font-medium text-text-secondary transition-colors hover:bg-brand-subtle hover:text-brand"
          >
            <EditIcon className="h-3.5 w-3.5" strokeWidth={1.9} />
            이름 바꾸기
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onDelete?.()
            }}
            className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-13 font-medium text-text-secondary transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <TrashIcon className="h-3.5 w-3.5" strokeWidth={1.9} />
            삭제
          </button>
        </div>
      )}
    </div>
  )
}
