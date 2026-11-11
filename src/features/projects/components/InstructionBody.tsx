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
