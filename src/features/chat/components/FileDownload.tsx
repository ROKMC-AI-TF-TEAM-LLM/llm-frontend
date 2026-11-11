import { useState } from 'react'
import type { FileAttachment } from '@/shared/types/attachment'
import {
  downloadAttachment,
  fileExtOf,
} from '@/shared/utils/downloadAttachment'
import { formatFileSize } from '@/shared/utils/fileSize'
import { DownloadIcon, FileIcon, SpinnerIcon } from '@/shared/components/icons'

interface FileDownloadProps {
  attachments?: FileAttachment[]
}

export default function FileDownload({ attachments }: FileDownloadProps) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  if (!attachments || attachments.length === 0) return null

  const download = async (att: FileAttachment) => {
    if (busyId) return
    setBusyId(att.attachment_id)
    setErr(null)
    const msg = await downloadAttachment(att)
    if (msg) setErr(msg)
    setBusyId(null)
  }

  return (
    <div className="ml-1 mb-3 mt-1 space-y-2">
      {attachments.map((att) => {
        const ext = fileExtOf(att.name)
        const sizeText = formatFileSize(att.size)
        const busy = busyId === att.attachment_id
        const meta = [ext, sizeText].filter(Boolean).join(' · ')
        return (
          <button
            key={att.attachment_id}
            type="button"
            disabled={busy}
            onClick={() => download(att)}
            className="group w-full flex items-center gap-3 p-3 rounded-xl border border-brand-soft bg-brand-subtle text-left transition-colors hover:bg-brand-soft disabled:opacity-60 disabled:cursor-default"
          >
            <div className="shrink-0 w-9 h-9 rounded-lg bg-brand flex items-center justify-center">
              <FileIcon width={18} height={18} stroke="white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-13 font-semibold text-text-primary truncate">
                {att.name}
              </p>
              <p className="text-[11.5px] text-brand-hover font-medium mt-0.5">
                {meta ? `${meta} · ` : ''}
                {busy ? '내려받는 중...' : '다운로드'}
              </p>
            </div>
            {busy ? (
              <SpinnerIcon className="shrink-0 w-5 h-5 text-brand animate-spin" />
            ) : (
              <DownloadIcon className="shrink-0 w-5 h-5 text-brand transition-transform group-hover:translate-y-0.5" />
            )}
          </button>
        )
      })}
      {err && <p className="text-12 text-status-error ml-1">{err}</p>}
    </div>
  )
}
