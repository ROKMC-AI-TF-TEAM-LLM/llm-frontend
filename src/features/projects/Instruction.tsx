// 프로젝트 지침: 본문 표시와 편집 모달
import { useEffect, useState } from 'react'
import { CloseIcon } from './icons'
import { IconButton } from './primitives'

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
