// TEMP(시안 비교용) v3 미리보기 중심: 왼쪽 좁은 작업 패널(입력·양식 목록·진행 상황), 오른쪽 넓은 문서 뷰어
import { selectable, useDocGenPage } from '../../../features/docgen/hooks'
import { ArrowUpIcon, CheckIcon } from '../../../features/docgen/icons'
import {
  ComposerOptions, JobActions, JobProgressText, PreviewActions, PreviewBody, ProgressBar, StatusDot,
} from '../../../features/docgen/components'
import { normalizeJobStatus } from '../../../utils/docgen'
import DraftBar from './DraftBar'
import { useFreshDraft } from './draftState'

export default function DraftV3() {
  useFreshDraft()
  const { jobs, c, selected, select, isFresh, send } = useDocGenPage()

  return (
    <div className="flex h-full flex-col">
      <DraftBar current="v3" />
      <div className="flex min-h-0 flex-1 flex-wrap md:flex-nowrap">
        {/* 왼쪽 작업 패널 */}
        <div className="custom-scroll flex w-full shrink-0 flex-col gap-5 overflow-y-auto border-r border-surface-border px-5 py-6 md:w-[380px]">
          <h1 className="text-[18px] font-bold text-text-primary">문서 생성</h1>

          <section aria-label="프롬프트 입력" className="rounded-2xl border border-surface-border focus-within:border-brand">
            <label htmlFor="v3-prompt" className="sr-only">프롬프트</label>
            <textarea
              id="v3-prompt"
              value={c.prompt}
              onChange={(e) => c.setPrompt(e.target.value)}
              rows={5}
              placeholder="어떤 문서를 만들지 적어주세요"
              className="w-full resize-none bg-transparent px-4 pt-4 text-[14px] leading-relaxed text-text-primary outline-none placeholder:text-text-muted"
            />
            <div className="flex flex-wrap items-center gap-0.5 px-2 pb-2 pt-1">
              <ComposerOptions c={c} />
            </div>
          </section>

          <section aria-label="양식 선택">
            <h2 className="mb-2 text-[12.5px] font-semibold text-text-muted">양식</h2>
            <div className="flex flex-col gap-1">
              {c.templates.map((t) => {
                const on = t.template_id === c.templateId
                return (
                  <button key={t.template_id} type="button" aria-pressed={on} onClick={() => c.pickTemplate(t.template_id)}
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

          <button type="button" disabled={!c.canSubmit} onClick={send} className="btn-primary w-full gap-1.5 disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-text-muted">
            <ArrowUpIcon className="h-4 w-4" /> 문서 생성
          </button>

          <section aria-label="진행 상황">
            <h2 className="mb-2 text-[12.5px] font-semibold text-text-muted">진행 상황 {jobs.length}</h2>
            {jobs.length === 0 ? (
              <p className="rounded-xl bg-surface-card1 px-3 py-5 text-center text-[12.5px] text-text-muted">요청하면 여기에 쌓입니다.</p>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {jobs.map((job) => {
                  const on = job.job_id === selected?.job_id
                  return (
                    <li key={job.job_id} aria-pressed={on} {...selectable(() => select(job.job_id))}
                      className={`group cursor-pointer rounded-xl px-3 py-2.5 ${on ? 'bg-brand-subtle' : 'hover:bg-surface-card1'} ${isFresh(job.job_id) ? 'animate-docgen-row-in' : ''}`}>
                      <div className="flex items-center gap-2">
                        <StatusDot job={job} />
                        <span className={`min-w-0 flex-1 truncate text-[13px] font-semibold ${on ? 'text-brand' : 'text-text-primary'}`}>{job.title}</span>
                      </div>
                      {normalizeJobStatus(job.status) === 'running' && <ProgressBar value={job.progress} className="ml-4 mt-2" />}
                      <div className="mt-1 flex items-center justify-between gap-2 pl-4 text-[11.5px] text-text-muted">
                        <JobProgressText job={job} />
                        <span onClick={(e) => e.stopPropagation()} className={on ? '' : 'opacity-0 group-hover:opacity-100'}><JobActions job={job} /></span>
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
        </section>
      </div>
    </div>
  )
}
