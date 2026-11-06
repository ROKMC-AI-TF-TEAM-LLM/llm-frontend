// 프로젝트 화면 목록 줄: 문서·업로드 중·채팅 줄과 빈 파일 안내
import { useEffect, useState } from 'react'
import type { ProjectChat } from './types'
import type { ProjectDocument } from '../../types/project'
import { displaySessionTitle } from '../../utils/sessionTitle'
import { formatFileSize } from '../../utils/downloadAttachment'
import { normalizeDocStatus } from '../../utils/document'
import {
  CloseIcon,
  EditIcon,
  FileIcon,
  StarIcon,
  TrashIcon,
  UploadIcon,
} from './icons'
import { IconButton } from './primitives'

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
        failedLook ? 'bg-red-50/70' : deleting ? '' : 'hover:bg-[#fdf6f7]'
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
          <FileIcon className="h-3.5 w-3.5" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-[13px] font-medium ${deleting ? 'text-text-muted line-through' : 'text-text-primary'}`}
        >
          {doc.name}
        </span>
        <span className="mt-0.5 block text-[11px] text-text-muted" aria-live="polite">
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
          className="shrink-0 rounded-md border border-brand-soft px-2 py-1 text-[11px] font-semibold text-brand transition-colors hover:bg-brand-subtle"
        >
          재시도
        </button>
      )}
      {onDelete && (
        <IconButton label="파일 제거" danger onClick={onDelete} disabled={deleting}>
          <CloseIcon className="h-3.5 w-3.5" />
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
        <span className="block truncate text-[13px] font-medium text-text-primary">{name}</span>
        <span className="mt-0.5 block text-[11px] text-text-muted">
          업로드 중...{sizeText ? ` · ${sizeText}` : ''}
        </span>
      </span>
    </div>
  )
}

export function ChatRow({
  chat,
  active = false,
  onClick,
  onToggleFavorite,
  onRename,
  onDelete,
}: {
  chat: ProjectChat
  active?: boolean
  onClick?: () => void
  onToggleFavorite?: () => void
  onRename?: (next: string) => void
  onDelete?: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(chat.title)
  const { text, isUntitled } = displaySessionTitle(chat.title)

  const hoverBg = active ? '#fdedf2' : '#fdf6f7'

  const submit = () => {
    const next = draft.trim()
    if (next && next !== chat.title) onRename?.(next)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="px-1 py-1">
        <input
          autoFocus
          spellCheck={false}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={submit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
            if (e.key === 'Escape') setEditing(false)
          }}
          className="w-full rounded-[8px] border border-[#f0e6e8] bg-white px-2.5 py-2 text-[13px] text-text-primary outline-none focus:border-brand"
        />
      </div>
    )
  }

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        style={active ? { background: '#fdedf2' } : {}}
        className={`flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-left transition-colors ${
          active ? '' : 'hover:bg-[#fdf6f7]'
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate text-[13px] ${
            isUntitled
              ? 'text-text-muted'
              : active
                ? 'font-bold text-[#c0002a]'
                : 'font-medium text-text-primary'
          }`}
        >
          {text}
        </span>
        <span className="shrink-0 text-[11.5px] text-text-muted transition-opacity group-hover:opacity-0">
          {chat.updatedAt}
        </span>
      </button>

      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-24 rounded-r-[10px] opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: `linear-gradient(to right, transparent 0%, ${hoverBg} 45%)` }}
      />

      <div className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 group-hover:flex">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite?.()
          }}
          aria-label={chat.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          className={`rounded-[7px] p-1.5 transition-colors ${
            chat.isFavorite ? 'text-brand' : 'text-text-muted hover:text-brand'
          } hover:bg-white`}
        >
          <StarIcon className="h-3.5 w-3.5" filled={chat.isFavorite} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setDraft(chat.title)
            setEditing(true)
          }}
          aria-label="이름 변경"
          className="rounded-[7px] p-1.5 text-text-muted transition-colors hover:bg-white hover:text-brand"
        >
          <EditIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete?.()
          }}
          aria-label="대화 삭제"
          className="rounded-[7px] p-1.5 text-text-muted transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <TrashIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}


export function EmptyFiles() {
  return (
    <div className="rounded-[10px] bg-[#faf7f8] px-4 py-6 text-center">
      <UploadIcon className="mx-auto h-5 w-5 text-brand opacity-50" />
      <p className="mt-2 text-[12px] leading-relaxed text-text-muted">
        이 프로젝트에서 참조할 문서를 추가하세요.
      </p>
    </div>
  )
}
