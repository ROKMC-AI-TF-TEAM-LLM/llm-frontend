import { useEffect, useRef, useState } from 'react'
import type { ProjectChat, ProjectFile } from './mock'
import type { ProjectDocument } from '../../types/project'
import { displaySessionTitle } from '../../utils/sessionTitle'
import { formatFileSize } from '../../utils/downloadAttachment'
import { normalizeDocStatus } from '../../utils/document'
import {
  ChatIcon,
  ChevronDown,
  ChevronRight,
  CloseIcon,
  EditIcon,
  FileIcon,
  LayersIcon,
  MoreIcon,
  NewChatIcon,
  PanelIcon,
  PlusIcon,
  SparkIcon,
  StarIcon,
  TrashIcon,
  UploadIcon,
} from './icons'

export function Mark({ size = 34, active = false }: { size?: number; active?: boolean }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.29),
        background: active ? 'var(--color-brand)' : 'var(--color-brand-subtle)',
        color: active ? '#fff' : 'var(--color-brand)',
        border: active ? 'none' : '1px solid #f7dfe4',
      }}
      className="inline-flex shrink-0 items-center justify-center"
    >
      <LayersIcon className="h-[45%] w-[45%]" />
    </span>
  )
}

export function Block({
  icon,
  title,
  action,
  children,
}: {
  icon?: React.ReactNode
  title: string
  action?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-[14px] border border-[#f0e6e8] bg-white">
      <header className="flex items-center gap-2 border-b border-[#f4eced] px-4 py-3">
        {icon && <span className="shrink-0 text-brand">{icon}</span>}
        <h2 className="flex-1 truncate text-[13.5px] font-bold tracking-[-0.01em] text-text-primary">
          {title}
        </h2>
        {action}
      </header>
      {children && <div className="px-4 py-3.5">{children}</div>}
    </section>
  )
}

export function IconButton({
  label,
  onClick,
  active = false,
  children,
  danger = false,
  disabled = false,
}: {
  label: string
  onClick?: () => void
  active?: boolean
  children: React.ReactNode
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] transition-colors ${
        active
          ? 'text-brand hover:bg-brand-subtle'
          : danger
            ? 'text-text-muted hover:bg-red-50 hover:text-red-500'
            : 'text-text-muted hover:bg-[#f7f2f3] hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  )
}

export function FavStar({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <IconButton label={active ? '즐겨찾기 해제' : '즐겨찾기 추가'} onClick={onToggle} active={active}>
      <StarIcon className="h-[17px] w-[17px]" filled={active} />
    </IconButton>
  )
}

export function KebabMenu({
  onRename,
  onDelete,
}: {
  onRename?: () => void
  onDelete?: () => void
} = {}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative shrink-0">
      <IconButton label="더보기" onClick={() => setOpen((v) => !v)}>
        <MoreIcon className="h-4 w-4" />
      </IconButton>
      {open && (
        <div
          style={{ boxShadow: '0 16px 40px rgba(60,30,38,0.13)' }}
          className="absolute left-0 top-[calc(100%+5px)] z-30 w-[158px] animate-fade-in overflow-hidden rounded-[12px] border border-[#f0e6e8] bg-white p-1.5"
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onRename?.()
            }}
            className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[13px] font-medium text-text-secondary transition-colors hover:bg-brand-subtle hover:text-brand"
          >
            <EditIcon className="h-3.5 w-3.5" />
            이름 바꾸기
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onDelete?.()
            }}
            className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[13px] font-medium text-text-secondary transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            삭제
          </button>
        </div>
      )}
    </div>
  )
}

export function ProjectPath({
  projectName,
  sessionTitle,
}: {
  projectName: string
  sessionTitle?: string | null
}) {
  const hasSession = sessionTitle !== undefined
  const { text, isUntitled } = displaySessionTitle(sessionTitle)

  return (
    <div className="flex min-w-0 items-center gap-1.5 text-[13px]">
      <span className="shrink-0 font-medium text-text-muted">{projectName}</span>
      {hasSession && (
        <>
          <span className="shrink-0 text-text-hint">/</span>
          <span className={`truncate ${isUntitled ? 'text-text-muted' : 'font-bold text-text-primary'}`}>
            {text}
          </span>
        </>
      )}
    </div>
  )
}

export function FileRow({ file }: { file: ProjectFile }) {
  return (
    <div className="group flex items-center gap-2.5 rounded-[10px] px-2 py-2 transition-colors hover:bg-[#fdf6f7]">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-brand-subtle text-brand">
        <FileIcon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-text-primary">{file.name}</span>
        <span className="mt-0.5 block text-[11px] text-text-muted">
          {file.ext} · {file.size}
          {file.lines ? ` · ${file.lines}` : ''}
        </span>
      </span>
      <IconButton label="파일 제거" danger>
        <CloseIcon className="h-3.5 w-3.5" />
      </IconButton>
    </div>
  )
}

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

  return (
    <div
      className={`group flex items-center gap-2.5 rounded-[10px] px-2 py-2 transition-colors ${
        isFailed ? 'bg-red-50/70' : 'hover:bg-[#fdf6f7]'
      } ${isBusy ? 'opacity-60' : ''}`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] ${
          isFailed ? 'bg-red-100 text-red-500' : 'bg-brand-subtle text-brand'
        }`}
      >
        {isBusy ? (
          <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          <FileIcon className="h-3.5 w-3.5" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-text-primary">{doc.name}</span>
        <span className="mt-0.5 block text-[11px] text-text-muted">
          {isBusy ? '색인 중...' : isFailed ? '색인 실패' : `${ext}${size ? ` · ${size}` : ''}`}
        </span>
      </span>
      {isFailed && onRetry && (
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

export function InstructionBody({
  text,
  onEdit,
  clamp,
}: {
  text: string
  onEdit: () => void
  clamp?: number
}) {
  if (!(text ?? '').trim()) {
    return (
      <button
        type="button"
        onClick={onEdit}
        className="w-full rounded-[10px] border border-dashed border-[#efdfe3] px-3 py-3 text-left text-[12.5px] text-text-muted transition-colors hover:border-brand-soft hover:bg-brand-subtle hover:text-brand"
      >
        MARS의 응답을 맞춤화하는 지침 추가
      </button>
    )
  }
  return (
    <div>
      <p
        className="whitespace-pre-line text-[12.5px] leading-[1.75] text-text-secondary"
        style={
          clamp
            ? { display: '-webkit-box', WebkitLineClamp: clamp, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
            : undefined
        }
      >
        {text}
      </p>
      {clamp && (
        <button
          type="button"
          onClick={onEdit}
          className="mt-2 text-[11.5px] font-semibold text-brand transition-colors hover:text-brand-hover"
        >
          전체 보기
        </button>
      )}
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

export function Composer({
  placeholder = '무엇이든 물어보세요',
  notice,
}: {
  placeholder?: string
  notice?: string
}) {
  const [value, setValue] = useState('')
  const [pendingFile, setPendingFile] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const dotIndex = pendingFile ? pendingFile.lastIndexOf('.') : -1
  const pendingExt = dotIndex !== -1 ? pendingFile!.slice(dotIndex + 1).toUpperCase() : null
  const pendingBasename = dotIndex !== -1 ? pendingFile!.slice(0, dotIndex) : pendingFile

  return (
    <div className="w-full">
      <div
        style={{ border: '1px solid #f0e3e6', boxShadow: '0 12px 30px rgba(160,0,40,0.05)' }}
        className="cursor-text overflow-hidden rounded-[30px] bg-surface transition-all duration-200 focus-within:border-[#e4002b] focus-within:shadow-[0_0_0_3px_rgba(228,0,43,0.07)]"
        onClick={() => textareaRef.current?.focus()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.hwp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            setPendingFile(file.name)
            e.target.value = ''
          }}
        />

        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => {
            const el = e.target
            setValue(el.value)
            el.style.overflowY = 'hidden'
            el.style.height = 'auto'
            el.style.height = `${el.scrollHeight}px`
            if (el.scrollHeight > 192) el.style.overflowY = 'auto'
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
            }
          }}
          placeholder={pendingFile ? '메시지를 입력하세요...' : placeholder}
          className="max-h-48 w-full resize-none overflow-y-hidden bg-transparent px-5 pt-6.5 pb-1 text-[15px] leading-normal text-text-primary outline-none placeholder-text-muted"
        />

        {pendingFile && (
          <div className="flex items-center gap-2 px-3 pt-2">
            <div className="flex max-w-full items-center gap-2 rounded-xl bg-brand px-3 py-2 text-white">
              <div className="shrink-0 rounded-lg bg-brand-soft p-1.5">
                <FileIcon className="h-4 w-4 text-brand" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="max-w-45 truncate text-xs font-medium">{pendingBasename}</span>
                {pendingExt && (
                  <span className="text-xs uppercase tracking-wide text-white/70">{pendingExt}</span>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setPendingFile(null)
                }}
                className="ml-1 shrink-0 text-white/60 hover:text-white"
                aria-label="첨부 취소"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <div
          className="flex cursor-text items-center justify-between px-3 pt-1 pb-3"
          onClick={() => textareaRef.current?.focus()}
        >
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-brand-subtle hover:text-brand"
            aria-label="첨부"
            onClick={(e) => {
              e.stopPropagation()
              fileInputRef.current?.click()
            }}
          >
            <svg
              className="h-[22px] w-[22px]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.9}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </button>

          {value.trim() || pendingFile ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
              }}
              style={{
                background: 'linear-gradient(135deg,#e4002b,#ff2d55)',
                boxShadow: '0 5px 13px rgba(228,0,43,0.28)',
              }}
              className="flex h-10 w-10 shrink-0 animate-fade-in items-center justify-center rounded-full transition-transform hover:brightness-105 active:scale-95"
              aria-label="전송"
            >
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.4}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
      {notice && <p className="mt-3 text-center text-xs text-text-muted">{notice}</p>}
    </div>
  )
}

export function CreateProjectModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (name: string, instructions: string) => void
}) {
  if (!open) return null
  return <CreateProjectBody onClose={onClose} onSubmit={onSubmit} />
}

function CreateProjectBody({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (name: string, instructions: string) => void
}) {
  const [name, setName] = useState('')
  const [instructions, setInstructions] = useState('')

  useEffect(() => {
    document.body.classList.add('modal-open')
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const canSubmit = name.trim().length > 0
  const submit = () => {
    if (!canSubmit) return
    onSubmit(name.trim(), instructions.trim())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 animate-fade-in bg-[rgba(26,25,23,0.28)]" onClick={onClose} />
      <div
        style={{ boxShadow: '0 28px 70px rgba(60,20,30,0.20)' }}
        className="relative z-10 flex w-full max-w-[600px] animate-page-in flex-col overflow-hidden rounded-[18px] bg-white"
      >
        <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-brand-subtle text-brand">
              <LayersIcon className="h-4 w-4" />
            </span>
            <h2 className="text-[16px] font-bold tracking-[-0.01em] text-text-primary">새 프로젝트</h2>
          </div>
          <IconButton label="닫기" onClick={onClose}>
            <CloseIcon className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="px-6 pt-4">
          <label htmlFor="project-name" className="mb-1.5 block text-[13px] font-semibold text-text-primary">
            프로젝트 이름
          </label>
          <input
            id="project-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
            placeholder="프로젝트 이름"
            className="w-full rounded-[10px] border border-[#f0e6e8] px-3.5 py-2.5 text-[13.5px] text-text-primary outline-none transition-colors placeholder:text-[#b8a7ac] focus:border-brand"
          />
        </div>

        <div className="px-6 pt-4">
          <label
            htmlFor="project-instructions"
            className="mb-1.5 block text-[13px] font-semibold text-text-primary"
          >
            프로젝트 지침 <span className="font-normal text-text-muted">(선택)</span>
          </label>
          <textarea
            id="project-instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            spellCheck={false}
            placeholder="MARS가 채택하기를 원하는 어조, 형식, 인용 규칙에 대한 지침을 추가하세요."
            className="min-h-[150px] w-full resize-none rounded-[10px] border border-[#f0e6e8] px-3.5 py-3 text-[13.5px] leading-[1.75] text-text-primary outline-none transition-colors placeholder:text-[#b8a7ac] focus:border-brand"
          />
        </div>

        <div className="flex items-center justify-end gap-2 px-6 pt-2 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-[13.5px] font-semibold text-text-secondary transition-colors hover:bg-[#f7f2f3]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            style={canSubmit ? { background: 'var(--color-brand)' } : undefined}
            className={`rounded-full px-5 py-2 text-[13.5px] font-semibold transition-colors ${
              canSubmit ? 'text-white hover:bg-[var(--color-brand-hover)]' : 'bg-[#f4eced] text-[#cbbcc0]'
            }`}
          >
            만들기
          </button>
        </div>
      </div>
    </div>
  )
}

export function FilesModal({
  open,
  documents,
  onClose,
  onUpload,
  onDelete,
  onRetry,
  deleting = false,
}: {
  open: boolean
  documents: ProjectDocument[]
  onClose: () => void
  onUpload?: (file: File) => void
  onDelete?: (documentId: string) => void
  onRetry?: (documentId: string) => void
  deleting?: boolean
}) {
  if (!open) return null
  return (
    <FilesModalBody
      documents={documents}
      onClose={onClose}
      onUpload={onUpload}
      onDelete={onDelete}
      onRetry={onRetry}
      deleting={deleting}
    />
  )
}

function FilesModalBody({
  documents,
  onClose,
  onUpload,
  onDelete,
  onRetry,
  deleting,
}: {
  documents: ProjectDocument[]
  onClose: () => void
  onUpload?: (file: File) => void
  onDelete?: (documentId: string) => void
  onRetry?: (documentId: string) => void
  deleting?: boolean
}) {
  const [query, setQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.body.classList.add('modal-open')
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const q = query.trim().toLowerCase()
  const shown = q ? documents.filter((d) => d.name.toLowerCase().includes(q)) : documents

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 animate-fade-in bg-[rgba(26,25,23,0.28)]" onClick={onClose} />
      <div
        style={{ boxShadow: '0 28px 70px rgba(60,20,30,0.20)' }}
        className="relative z-10 flex max-h-[80vh] w-full max-w-[600px] animate-page-in flex-col overflow-hidden rounded-[18px] bg-white"
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5">
          <div>
            <h2 className="text-[16px] font-bold tracking-[-0.01em] text-text-primary">파일</h2>
            <p className="mt-1 text-[12.5px] text-text-secondary">
              이 프로젝트에 컨텍스트를 제공하기 위해 업로드된 파일
            </p>
          </div>
          <IconButton label="닫기" onClick={onClose}>
            <CloseIcon className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex items-center gap-2.5 px-6 pt-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="파일 검색"
            className="min-w-0 flex-1 rounded-[10px] border border-[#f0e6e8] px-3.5 py-2.5 text-[13.5px] text-text-primary outline-none transition-colors placeholder:text-[#b8a7ac] focus:border-brand"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onUpload?.(file)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] border border-[#f0e6e8] px-3.5 py-2.5 text-[13.5px] font-semibold text-text-secondary transition-colors hover:border-brand-soft hover:bg-brand-subtle hover:text-brand"
          >
            <PlusIcon className="h-4 w-4" />
            첨부
          </button>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto border-t border-[#f4eced] px-6 py-4">
          {shown.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-text-muted">
              {q ? '검색 결과가 없습니다' : '아직 업로드된 파일이 없습니다'}
            </p>
          ) : (
            <div className="-mx-2">
              {shown.map((d) => (
                <ProjectDocRow
                  key={d.document_id}
                  doc={d}
                  onRetry={onRetry ? () => onRetry(d.document_id) : undefined}
                  onDelete={onDelete ? () => onDelete(d.document_id) : undefined}
                  deleting={deleting}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#f4eced] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-[13.5px] font-semibold text-text-secondary transition-colors hover:bg-[#f7f2f3]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'var(--color-brand)' }}
            className="rounded-full px-5 py-2 text-[13.5px] font-semibold text-white transition-colors hover:bg-[var(--color-brand-hover)]"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

export function InstructionModal({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean
  initial: string
  onClose: () => void
  onSave?: (instructions: string) => void
}) {
  if (!open) return null
  return <ModalBody initial={initial} onClose={onClose} onSave={onSave} />
}

function ModalBody({ initial, onClose, onSave }: { initial: string; onClose: () => void; onSave?: (v: string) => void }) {
  const [draft, setDraft] = useState(initial)
  const save = () => { onSave?.(draft); onClose() }

  useEffect(() => {
    document.body.classList.add('modal-open')
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 animate-fade-in bg-[rgba(26,25,23,0.28)]" onClick={onClose} />
      <div
        style={{ boxShadow: '0 28px 70px rgba(60,20,30,0.20)' }}
        className="relative z-10 flex max-h-[80vh] w-full max-w-[600px] animate-page-in flex-col overflow-hidden rounded-[18px] bg-white"
      >
        <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4">
          <h2 className="text-[16px] font-bold tracking-[-0.01em] text-text-primary">프로젝트 지침</h2>
          <IconButton label="닫기" onClick={onClose}>
            <CloseIcon className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-1">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
            spellCheck={false}
            maxLength={1000}
            placeholder="MARS가 채택하기를 원하는 어조, 형식, 인용 규칙에 대한 지침을 추가하세요."
            className="min-h-[240px] w-full resize-none rounded-[12px] border border-[#f0e6e8] bg-white px-4 py-3.5 text-[13.5px] leading-[1.75] text-text-primary outline-none transition-colors placeholder:text-[#b8a7ac] focus:border-brand"
          />
          <div className={`mt-1.5 text-right text-[12px] tabular-nums ${draft.length >= 1000 ? 'text-brand' : 'text-text-muted'}`}>
            {draft.length} / 1000
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-[13.5px] font-semibold text-text-secondary transition-colors hover:bg-[#f7f2f3]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={save}
            style={{ background: 'var(--color-brand)' }}
            className="rounded-full px-5 py-2 text-[13.5px] font-semibold text-white transition-colors hover:bg-[var(--color-brand-hover)]"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

export { ChatIcon, FileIcon, LayersIcon, SparkIcon, PlusIcon, ChevronRight, ChevronDown, StarIcon, UploadIcon, CloseIcon, PanelIcon, NewChatIcon }
