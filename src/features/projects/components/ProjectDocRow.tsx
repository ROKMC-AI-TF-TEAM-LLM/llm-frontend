import { useEffect, useState } from 'react'
import type { ProjectDocument } from '../types'
import { formatFileSize } from '@/shared/utils/fileSize'
import { normalizeDocStatus } from '@/features/documents/utils'
import IconButton from '@/shared/components/IconButton'
import { CloseIcon, FileIcon } from '@/shared/components/icons'

export function ProjectDocRow({
  doc,
  onRetry,
  onDelete,
  deleting = false,
}: {
  doc: ProjectDocument
  onRetry?: () => void
  onDelete?: () => void
  deleting?: boolean
}) {
  const state = normalizeDocStatus(doc.status)
  const isBusy = state === 'processing'
  const isFailed = state === 'failed'
  const dot = doc.name.lastIndexOf('.')
  const ext = dot > 0 ? doc.name.slice(dot + 1).toUpperCase() : '문서'
  const size = formatFileSize(doc.size)
  // 삭제 중이면 색인 상태보다 삭제 진행을 우선 표시한다.
  const failedLook = isFailed && !deleting

  return (
    <div
      className={`group flex items-center gap-2.5 rounded-[10px] px-2 py-2 transition-colors ${
        failedLook ? 'bg-red-50/70' : deleting ? '' : 'hover:bg-rose-hover'
      } ${isBusy || deleting ? 'opacity-60' : ''}`}
      aria-busy={deleting || undefined}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] ${
          deleting ? 'bg-red-50 text-red-400' : failedLook ? 'bg-red-100 text-red-500' : 'bg-brand-subtle text-brand'
        }`}
      >
        {isBusy || deleting ? (
          <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          <FileIcon className="h-3.5 w-3.5" strokeWidth={1.9} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-13 font-medium ${deleting ? 'text-text-muted line-through' : 'text-text-primary'}`}
        >
          {doc.name}
        </span>
        <span className="mt-0.5 block text-11 text-text-muted" aria-live="polite">
          {deleting ? (
            <DeletingStatus />
          ) : isBusy ? (
            '색인 중...'
          ) : isFailed ? (
            '색인 실패'
          ) : (
            `${ext}${size ? ` · ${size}` : ''}`
          )}
        </span>
      </span>
      {failedLook && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-md border border-brand-soft px-2 py-1 text-11 font-semibold text-brand transition-colors hover:bg-brand-subtle"
        >
          재시도
        </button>
      )}
      {onDelete && (
        <IconButton label="파일 제거" danger onClick={onDelete} disabled={deleting}>
          <CloseIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
        </IconButton>
      )}
    </div>
  )
}

// 삭제가 오래 걸릴 수 있어, 경과 시간을 보여 멈춘 것이 아님을 알린다.
function DeletingStatus() {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const started = Date.now()
    const t = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000)
    return () => window.clearInterval(t)
  }, [])
  if (elapsed < 3) return <>삭제 중...</>
  return <>삭제 중... {elapsed}초</>
}

// 서버 응답 전(전송 중)인 파일. 응답 후에는 목록에 실제 행(색인 중)이 나타난다.
export function UploadingDocRow({ name, size }: { name: string; size: number }) {
  const sizeText = formatFileSize(size)
  return (
    <div className="flex items-center gap-2.5 rounded-[10px] px-2 py-2 opacity-60" aria-live="polite">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-brand-subtle text-brand">
        <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-13 font-medium text-text-primary">{name}</span>
        <span className="mt-0.5 block text-11 text-text-muted">
          업로드 중...{sizeText ? ` · ${sizeText}` : ''}
        </span>
      </span>
    </div>
  )
}
