import Button from '@/shared/components/Button'
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
        className="w-full rounded-[10px] border border-dashed border-rose-border px-3 py-3 text-left text-13 text-text-muted transition-colors hover:border-brand-soft hover:bg-brand-subtle hover:text-brand"
      >
        MARS의 응답을 맞춤화하는 지침 추가
      </button>
    )
  }
  return (
    <div>
      <p
        className="whitespace-pre-line text-13 leading-[1.75] text-text-secondary"
        style={
          clamp
            ? {
                display: '-webkit-box',
                WebkitLineClamp: clamp,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }
            : undefined
        }
      >
        {text}
      </p>
      {clamp && (
        <Button variant="link" size="sm" onClick={onEdit} className="mt-2">
          전체 보기
        </Button>
      )}
    </div>
  )
}
