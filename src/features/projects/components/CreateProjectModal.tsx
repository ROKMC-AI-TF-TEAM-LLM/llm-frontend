import { useState } from 'react'
import Button from '@/shared/components/Button'
import IconButton from '@/shared/components/IconButton'
import Modal from '@/shared/components/Modal'
import { LayersIcon } from './icons'
import { CloseIcon } from '@/shared/components/icons'

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

  const canSubmit = name.trim().length > 0
  const submit = () => {
    if (!canSubmit) return
    onSubmit(name.trim(), instructions.trim())
    onClose()
  }

  return (
    <Modal
      onClose={onClose}
      className="flex w-full max-w-[600px] animate-page-in flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_28px_70px_rgba(60,20,30,0.20)]"
    >
      <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-1">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-brand-subtle text-brand">
            <LayersIcon className="h-4 w-4" />
          </span>
          <h2 className="text-16 font-bold tracking-[-0.01em] text-text-primary">
            새 프로젝트
          </h2>
        </div>
        <IconButton label="닫기" onClick={onClose}>
          <CloseIcon className="h-4 w-4" strokeWidth={2.2} />
        </IconButton>
      </div>

      <div className="px-6 pt-4">
        <label
          htmlFor="project-name"
          className="mb-1.5 block text-13 font-semibold text-text-primary"
        >
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
          className="w-full rounded-[10px] border border-rose-border px-3.5 py-2.5 text-[13.5px] text-text-primary outline-none transition-colors placeholder:text-rose-placeholder focus:border-brand"
        />
      </div>

      <div className="px-6 pt-4">
        <label
          htmlFor="project-instructions"
          className="mb-1.5 block text-13 font-semibold text-text-primary"
        >
          프로젝트 지침{' '}
          <span className="font-normal text-text-muted">(선택)</span>
        </label>
        <textarea
          id="project-instructions"
          value={instructions}
          maxLength={1000}
          onChange={(e) => setInstructions(e.target.value.slice(0, 1000))}
          spellCheck={false}
          placeholder="MARS가 채택하기를 원하는 어조, 형식, 인용 규칙에 대한 지침을 추가하세요."
          className="min-h-[150px] w-full resize-none rounded-[10px] border border-rose-border px-3.5 py-3 text-[13.5px] leading-[1.75] text-text-primary outline-none transition-colors placeholder:text-rose-placeholder focus:border-brand"
        />
      </div>

      <div className="flex items-center justify-end gap-2 px-6 pt-2 pb-5">
        <Button variant="ghost" onClick={onClose}>
          취소
        </Button>
        <Button variant="primary" onClick={submit} disabled={!canSubmit}>
          만들기
        </Button>
      </div>
    </Modal>
  )
}
