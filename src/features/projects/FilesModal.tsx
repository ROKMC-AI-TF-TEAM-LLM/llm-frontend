// 프로젝트 파일 모달
import { useEffect, useRef, useState } from 'react'
import type { ProjectDocument } from '../../types/project'
import { CloseIcon, PlusIcon } from './icons'
import { IconButton } from './primitives'
import { ProjectDocRow } from './rows'

export default function FilesModal({
  open,
  documents,
  onClose,
  onUpload,
  onDelete,
  onRetry,
  deletingIds = [],
}: {
  open: boolean
  documents: ProjectDocument[]
  onClose: () => void
  onUpload?: (file: File) => void
  onDelete?: (documentId: string) => void
  onRetry?: (documentId: string) => void
  deletingIds?: string[]
}) {
  if (!open) return null
  return (
    <FilesModalBody
      documents={documents}
      onClose={onClose}
      onUpload={onUpload}
      onDelete={onDelete}
      onRetry={onRetry}
      deletingIds={deletingIds}
    />
  )
}

function FilesModalBody({
  documents,
  onClose,
  onUpload,
  onDelete,
  onRetry,
  deletingIds = [],
}: {
  documents: ProjectDocument[]
  onClose: () => void
  onUpload?: (file: File) => void
  onDelete?: (documentId: string) => void
  onRetry?: (documentId: string) => void
  deletingIds?: string[]
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
                  deleting={deletingIds.includes(d.document_id)}
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
