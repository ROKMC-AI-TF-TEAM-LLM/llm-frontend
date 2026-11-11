import { useConfirmStore } from '../store/confirmStore'
import { useEscapeKey } from '../hooks/useEscapeKey'
import Button from './Button'
import Modal from './Modal'

/** confirm()으로 띄운 확인 창을 그린다. 앱 루트에 하나만 둔다 */
export default function ConfirmHost() {
  const current = useConfirmStore((s) => s.current)
  const close = useConfirmStore((s) => s.close)

  // 다른 모달 위에 떴을 때 ESC가 아래 모달까지 닫지 않도록 혼자 받는다
  useEscapeKey(() => close(false), !!current, { exclusive: true })

  if (!current) return null
  const { title, message, danger, confirmLabel = danger ? '삭제' : '확인', cancelLabel = '취소' } = current

  return (
    <Modal
      onClose={() => close(false)}
      style={{ boxShadow: '0 28px 70px rgba(60,20,30,0.20)' }}
      className="flex w-full max-w-[420px] animate-page-in flex-col overflow-hidden rounded-[18px] bg-white"
    >
      <div className="px-6 pt-6 pb-2">
        <h2 className="text-[16px] font-bold leading-snug tracking-[-0.01em] text-text-primary break-words">{title}</h2>
        {message && <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-text-secondary">{message}</p>}
      </div>
      <div className="flex items-center justify-end gap-2 px-6 py-4">
        <Button variant="ghost" onClick={() => close(false)}>
          {cancelLabel}
        </Button>
        {/* 확인 버튼에 포커스를 두어 Enter로 바로 확인할 수 있게 한다 */}
        <Button variant="primary" autoFocus onClick={() => close(true)}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
