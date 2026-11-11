import { useState, useCallback } from 'react'
import Drawer from '@/shared/components/Drawer'
import type { FileAttachment } from '@/shared/types/attachment'
import {
  downloadAttachment,
  fileExtOf,
} from '@/shared/utils/downloadAttachment'
import { formatFileSize } from '@/shared/utils/fileSize'
import {
  CloseIcon,
  DownloadIcon,
  FileIcon,
  SpinnerIcon,
} from '@/shared/components/icons'
import IconButton from '@/shared/components/IconButton'
import Button from '@/shared/components/Button'

interface FilesDrawerProps {
  open: boolean
  files: FileAttachment[]
  onClose: () => void
}

export default function FilesDrawer({
  open,
  files,
  onClose,
}: FilesDrawerProps) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const close = useCallback(() => onClose(), [onClose])

  const download = async (att: FileAttachment) => {
    if (busyId) return
    setBusyId(att.attachment_id)
    setErr(null)
    const msg = await downloadAttachment(att)
    if (msg) setErr(msg)
    setBusyId(null)
  }

  return (
    <Drawer open={open} onClose={close}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between h-14 px-5 shrink-0 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <span className="text-15 font-bold text-text-primary">파일</span>
            <span className="text-13 font-medium text-text-muted">
              {files.length}
            </span>
          </div>
          <IconButton onClick={close} label="닫기">
            <CloseIcon className="w-5 h-5" />
          </IconButton>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll px-5 py-4">
          {files.length === 0 ? (
            <p className="mt-10 text-sm text-center text-text-muted">
              이 대화에는 첨부된 파일이 없습니다.
            </p>
          ) : (
            <div className="space-y-2.5">
              {files.map((att) => {
                const ext = fileExtOf(att.name)
                const sizeText = formatFileSize(att.size)
                const busy = busyId === att.attachment_id
                const meta = [ext, sizeText].filter(Boolean).join(' · ')
                return (
                  <div
                    key={att.attachment_id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-surface-border bg-surface-subtle"
                  >
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-brand flex items-center justify-center">
                      <FileIcon width={19} height={19} stroke="white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-14 font-semibold text-text-primary truncate">
                        {att.name}
                      </p>
                      {meta && (
                        <p className="text-12 text-text-muted mt-0.5">{meta}</p>
                      )}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => download(att)}
                    >
                      {busy ? (
                        <SpinnerIcon className="w-4 h-4 animate-spin" />
                      ) : (
                        <DownloadIcon className="w-4 h-4" />
                      )}
                      다운로드
                    </Button>
                  </div>
                )
              })}
              {err && <p className="text-12 text-status-error">{err}</p>}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  )
}
