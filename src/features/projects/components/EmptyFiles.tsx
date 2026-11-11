import { UploadIcon } from '@/shared/components/icons'

export function EmptyFiles() {
  return (
    <div className="rounded-[10px] bg-[#faf7f8] px-4 py-6 text-center">
      <UploadIcon
        className="mx-auto h-5 w-5 text-brand opacity-50"
        strokeWidth={1.9}
      />
      <p className="mt-2 text-12 leading-relaxed text-text-muted">
        이 프로젝트에서 참조할 문서를 추가하세요.
      </p>
    </div>
  )
}
