// TEMP(시안 비교용) v4 미리보기 중심: 왼쪽 좁은 작업 패널(입력·양식 목록·간단 큐), 오른쪽 넓은 문서 뷰어
import { normalizeJobStatus } from '../../../utils/docgen'
import { TEMPLATES } from './fixtures'
import { useDraftScenario } from './draftState'
import {
  ArrowUpIcon, AttachmentChip, CheckIcon, ClipIcon, DomainOption, DraftBar, JobActions,
  JobProgressText, OptionChip, PreviewActions, PreviewBody, Spinner,
} from './shared'

const DOT: Record<string, string> = {
  queued: 'bg-text-muted',
  running: 'bg-brand',
  completed: 'bg-status-ok',
  failed: 'bg-status-error',
}

export default function DraftV4() {
  const { scenario } = useDraftScenario()
  const { selected, jobs, prompt, templateId, attachments } = scenario
  const canSubmit = !!prompt.trim() && !!templateId

  return (
    <div className="flex h-full flex-col">
      <DraftBar current="v4" />
      <div className="flex min-h-0 flex-1 flex-wrap md:flex-nowrap">
        {/* 왼쪽 작업 패널 */}
        <div className="custom-scroll flex w-full shrink-0 flex-col gap-5 overflow-y-auto border-r border-surface-border px-5 py-6 md:w-[380px]">
          <h1 className="text-[18px] font-bold text-text-primary">문서 생성</h1>

          <section aria-label="프롬프트 입력" className="rounded-2xl border border-surface-border focus-within:border-brand">
            <label htmlFor="v4-prompt" className="sr-only">프롬프트</label>
            <textarea
              id="v4-prompt"
              key={prompt}
              defaultValue={prompt}
              rows={5}
              placeholder="어떤 문서를 만들지 적어주세요"
              className="w-full resize-none bg-transparent px-4 pt-4 text-[14px] leading-relaxed text-text-primary outline-none placeholder:text-text-muted"
            />
            {attachments.length > 0 && (
              <div className="flex flex-col gap-1.5 px-3">{attachments.map((a) => <AttachmentChip key={a.name} {...a} />)}</div>
            )}
            <div className="flex flex-wrap items-center gap-0.5 px-2 pb-2 pt-1">
              <button type="button" aria-label="파일 첨부" className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted hover:bg-brand-subtle hover:text-brand">
                <ClipIcon className="h-4 w-4" />
              </button>
              <DomainOption code={templateId ? 'TECH' : null} />
              <OptionChip label={templateId ? 'HWPX' : '형식'} />
              <OptionChip label={templateId ? '보통' : '분량'} />
            </div>
          </section>

          <section aria-label="양식 선택">
            <h2 className="mb-2 text-[12.5px] font-semibold text-text-muted">양식</h2>
            <div className="flex flex-col gap-1">
              {TEMPLATES.map((t) => {
                const on = t.template_id === templateId
                return (
                  <button key={t.template_id} type="button" aria-pressed={on}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${on ? 'bg-brand-subtle' : 'hover:bg-surface-card1'}`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${on ? 'border-brand bg-brand text-white' : 'border-surface-border'}`}>
                      {on && <CheckIcon className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-[13.5px] font-semibold ${on ? 'text-brand' : 'text-text-primary'}`}>{t.name}</span>
                      <span className="block truncate text-[11.5px] text-text-muted">{t.description}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <button type="button" disabled={!canSubmit} className="btn-primary w-full gap-1.5 disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-text-muted">
            <ArrowUpIcon className="h-4 w-4" /> 문서 생성
          </button>

          <section aria-label="생성 큐">
            <h2 className="mb-2 text-[12.5px] font-semibold text-text-muted">생성 큐 {jobs.length}</h2>
            {jobs.length === 0 ? (
              <p className="rounded-xl bg-surface-card1 px-3 py-5 text-center text-[12.5px] text-text-muted">요청하면 여기에 쌓입니다.</p>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {jobs.map((job) => {
                  const s = normalizeJobStatus(job.status)
                  const on = job.job_id === selected?.job_id
                  return (
                    <li key={job.job_id} className={`group rounded-xl px-3 py-2.5 ${on ? 'bg-brand-subtle' : 'hover:bg-surface-card1'}`}>
                      <div className="flex items-center gap-2">
                        {s === 'running' ? <Spinner className="h-2.5 w-2.5 text-brand" /> : <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[s]}`} />}
                        <span className={`min-w-0 flex-1 truncate text-[13px] font-semibold ${on ? 'text-brand' : 'text-text-primary'}`}>{job.title}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 pl-4 text-[11.5px] text-text-muted">
                        <JobProgressText job={job} />
                        <span className={on ? '' : 'opacity-0 group-hover:opacity-100'}><JobActions job={job} /></span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        {/* 오른쪽 문서 뷰어 */}
        <section aria-label="미리보기" className="flex min-w-0 flex-1 flex-col bg-surface-subtle">
          <div className="flex flex-wrap items-center gap-2 border-b border-surface-border bg-surface px-6 py-3">
            <h2 className="min-w-0 flex-1 truncate text-[15px] font-bold text-text-primary">{selected ? selected.title : '미리보기'}</h2>
            <PreviewActions job={selected} />
          </div>
          <div className="custom-scroll flex flex-1 items-start justify-center overflow-y-auto p-8">
            <div className="w-full max-w-[620px]"><PreviewBody job={selected} /></div>
          </div>
          {selected?.result && (
            <div className="flex items-center justify-between border-t border-surface-border bg-surface px-6 py-2.5 text-[12.5px] text-text-secondary">
              <span>참고 근거 {selected.result.sources_count}건</span>
              <span>1 / {selected.result.page_count}쪽</span>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
