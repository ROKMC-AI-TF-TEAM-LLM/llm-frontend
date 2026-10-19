// TEMP(시안 비교용) v3 대화형: 새 채팅 화면 톤. 가운데 둥근 입력창 + 양식 칩, 큐는 카드, 미리보기는 오른쪽 드로어
import { normalizeJobStatus } from '../../../utils/docgen'
import { TEMPLATES } from './fixtures'
import { useDraftScenario } from './draftState'
import {
  ArrowUpIcon, AttachmentChip, ClipIcon, DocIcon, DomainOption, DraftBar, JobActions, JobMeta,
  JobProgressText, OptionChip, PreviewActions, PreviewBody, ProgressBar, StatusBadge, XIcon,
} from './shared'

export default function DraftV3() {
  const { state, scenario } = useDraftScenario()
  const { selected, jobs, prompt, templateId, attachments } = scenario
  const drawerOpen = !!selected
  const canSubmit = !!prompt.trim() && !!templateId

  return (
    <div className="flex h-full flex-col">
      <DraftBar current="v3" />
      <div className="flex min-h-0 flex-1">
        <div className="custom-scroll min-w-0 flex-1 overflow-y-auto">
          <div className={`mx-auto w-full max-w-[760px] px-6 ${state === 'idle' ? 'pt-[14vh]' : 'pt-10'} pb-10`}>
            <h1 className="text-center text-[28px] font-bold text-text-primary">
              어떤 <span className="text-brand">문서</span>를 만들까요?
            </h1>
            <p className="mt-2 text-center text-[13.5px] text-text-secondary">요청과 자료를 주시면 양식에 맞춰 초안을 써 드립니다.</p>

            <section aria-label="프롬프트 입력" className="mt-7 overflow-hidden rounded-[30px] border border-brand-soft bg-surface shadow-[0_12px_30px_rgba(220,20,60,0.05)] focus-within:border-brand">
              <label htmlFor="v3-prompt" className="sr-only">프롬프트</label>
              <textarea
                id="v3-prompt"
                key={prompt}
                defaultValue={prompt}
                rows={2}
                placeholder="메시지를 입력하세요..."
                className="w-full resize-none bg-transparent px-6 pt-6 text-[15px] text-text-primary outline-none placeholder:text-text-muted"
              />
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 px-4">{attachments.map((a) => <AttachmentChip key={a.name} {...a} />)}</div>
              )}
              <div className="flex items-center gap-1 px-3 pb-3 pt-2">
                <button type="button" aria-label="파일 첨부" className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted hover:bg-brand-subtle hover:text-brand">
                  <ClipIcon className="h-[18px] w-[18px]" />
                </button>
                <DomainOption code={templateId ? 'TECH' : null} />
                <OptionChip label={templateId ? 'HWPX' : '형식'} />
                <span className="flex-1" />
                <button
                  type="button"
                  aria-label="생성"
                  disabled={!canSubmit}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-light text-white shadow-[0_5px_13px_rgba(220,20,60,0.28)] disabled:from-surface-subtle disabled:to-surface-subtle disabled:text-text-muted disabled:shadow-none"
                >
                  <ArrowUpIcon className="h-5 w-5" />
                </button>
              </div>
            </section>

            <section aria-label="양식 선택" className="mt-4">
              <div className="flex flex-wrap justify-center gap-2">
                {TEMPLATES.map((t) => {
                  const on = t.template_id === templateId
                  return (
                    <button
                      key={t.template_id}
                      type="button"
                      aria-pressed={on}
                      title={t.description}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors ${on ? 'border-brand bg-brand-subtle text-brand' : 'border-surface-border text-text-secondary hover:border-brand-soft'}`}
                    >
                      <DocIcon className="h-3.5 w-3.5" />
                      {t.name}
                    </button>
                  )
                })}
              </div>
              <p className="mt-2 text-center text-[11.5px] text-text-muted">MARS v1.0.0은 AI이므로 실수를 할 수 있습니다. 중요한 정보는 재차 확인하십시오.</p>
            </section>

            {jobs.length > 0 && (
              <section aria-label="생성 큐" className="mt-10">
                <h2 className="mb-3 text-[13px] font-semibold text-text-muted">최근 생성</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {jobs.map((job) => {
                    const s = normalizeJobStatus(job.status)
                    const on = job.job_id === selected?.job_id
                    return (
                      <article key={job.job_id} className={`rounded-2xl border p-4 transition-colors ${on ? 'border-brand bg-brand-subtle/40' : 'border-surface-border hover:border-brand-soft'}`}>
                        <div className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand"><DocIcon className="h-4 w-4" /></span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-semibold text-text-primary">{job.title}</p>
                            <JobMeta job={job} />
                          </div>
                          <StatusBadge job={job} />
                        </div>
                        {s === 'running' && <ProgressBar value={job.progress} className="mt-3" />}
                        <div className="mt-3 flex items-center justify-between gap-2 text-[12px] text-text-secondary">
                          <JobProgressText job={job} />
                          <JobActions job={job} />
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* 오른쪽 드로어 */}
        <aside
          aria-label="미리보기"
          className={`h-full shrink-0 overflow-hidden border-l border-surface-border bg-surface transition-[width] duration-[420ms] ease-[cubic-bezier(.32,.72,0,1)] ${drawerOpen ? 'w-[min(520px,45vw)]' : 'w-0 border-l-0'}`}
        >
          <div className="flex h-full w-[min(520px,45vw)] flex-col">
            <div className="flex items-center gap-2 px-5 py-4">
              <h2 className="min-w-0 flex-1 truncate text-[15px] font-bold text-text-primary">{selected?.title}</h2>
              <button type="button" aria-label="미리보기 닫기" className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-subtle">
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 pb-3"><PreviewActions job={selected} /></div>
            <div className="custom-scroll flex flex-1 items-start justify-center overflow-y-auto bg-surface-card1 p-5">
              <PreviewBody job={selected} compact />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
