import { ArrowUpIcon } from './icons'
import { ComposerOptions, Spinner } from './components'
import type { Composer } from './hooks'

/** 요청 입력창: 프롬프트 + 분야·파일 유형·양식 칩 + 전송 버튼. Enter로 보내고 Shift+Enter로 줄을 바꾼다 */
export default function PromptBox({ c, pending, onSend }: { c: Composer; pending: boolean; onSend: () => void }) {
  const ready = c.canSubmit && !pending
  return (
    <section aria-label="문서 요청" className="rounded-[28px] border border-brand-soft bg-surface shadow-[0_12px_30px_rgba(220,20,60,0.05)] transition-colors focus-within:border-brand">
      <label htmlFor="docgen-prompt" className="sr-only">프롬프트</label>
      <textarea id="docgen-prompt" value={c.prompt} onChange={(e) => c.setPrompt(e.target.value)} rows={3}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            onSend()
          }
        }}
        placeholder="만들 문서를 설명해 주세요."
        className="w-full resize-none bg-transparent px-5 pt-5 text-[15px] leading-relaxed text-text-primary outline-none placeholder:text-text-muted sm:px-6" />
      <div className="flex flex-wrap items-center gap-1 px-3 pb-3 pt-2">
        <ComposerOptions c={c} withTemplate />
        <span className="flex-1" />
        <button type="button" aria-label="생성 요청" disabled={!ready} onClick={onSend}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${ready
            ? 'bg-gradient-to-br from-brand to-brand-light text-white shadow-[0_5px_13px_rgba(220,20,60,0.28)] hover:brightness-105'
            : 'bg-surface-subtle text-text-muted'}`}>
          {pending ? <Spinner className="h-4 w-4" /> : <ArrowUpIcon className="h-5 w-5" />}
        </button>
      </div>
    </section>
  )
}
