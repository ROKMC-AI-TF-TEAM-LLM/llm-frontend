// 새 프로젝트 만들기 모달
import { useEffect, useState } from 'react'
import { CloseIcon, LayersIcon } from './icons'
import { IconButton } from './primitives'

export default function CreateProjectModal({
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
            maxLength={255}
            onChange={(e) => setName(e.target.value.slice(0, 255))}
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
            maxLength={1000}
            onChange={(e) => setInstructions(e.target.value.slice(0, 1000))}
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
