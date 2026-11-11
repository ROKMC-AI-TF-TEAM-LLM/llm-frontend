import { useState } from 'react'
import Button from '@/shared/components/Button'
import IconButton from '@/shared/components/IconButton'
import Modal from '@/shared/components/Modal'
import { CloseIcon } from '@/shared/components/icons'

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

  return (
    <Modal
      onClose={onClose}
      style={{ boxShadow: '0 28px 70px rgba(60,20,30,0.20)' }}
      className="flex max-h-[80vh] w-full max-w-[600px] animate-page-in flex-col overflow-hidden rounded-[18px] bg-white"
    >
        <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4">
          <h2 className="text-[16px] font-bold tracking-[-0.01em] text-text-primary">프로젝트 지침</h2>
          <IconButton label="닫기" onClick={onClose}>
            <CloseIcon className="h-4 w-4" strokeWidth={2.2} />
          </IconButton>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-1">
          <p className="mb-3 rounded-[10px] bg-brand-subtle px-3.5 py-2.5 text-[12px] leading-[1.7] text-text-secondary">
            지침은 <b className="font-semibold text-text-primary">답변을 어떻게 쓸지</b>에만 쓰입니다 (예: 표로 정리, 항목별 구분, 용어 풀이).
            문서에 없는 내용을 답하게 하거나 규칙을 바꾸는 지침은 답변 정확도를 떨어뜨립니다.
          </p>
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
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" onClick={save}>
            저장
          </Button>
        </div>
    </Modal>
  )
}
