// TEMP(시안 비교용) v5 진행 강조: 번호 붙은 단계형 입력, 큐는 단계 타임라인, 미리보기는 탭(문서/근거/요청)
import type { ReactNode } from 'react'
import { formatClock, getJobErrorMessage, normalizeJobStatus } from '../../../utils/docgen'
import { TEMPLATES } from './fixtures'
import { useDraftScenario } from './draftState'
import {
  ArrowUpIcon, AttachmentChip, ClipIcon, DocIcon, DomainOption, DraftBar, JobActions,
  JobProgressText, OptionChip, PreviewActions, PreviewBody, StageSteps, StatusBadge,
} from './shared'

const Step = ({ n, title, children }: { n: number; title: string; children: ReactNode }) => (
  <section className="flex gap-4">
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-[13px] font-bold text-white">{n}</span>
    <div className="min-w-0 flex-1">
      <h2 className="mb-3 mt-0.5 text-[15px] font-bold text-text-primary">{title}</h2>
      {children}
    </div>
  </section>
)

export default function DraftV5() {
  const { scenario } = useDraftScenario()
  const { selected, jobs, prompt, templateId, attachments } = scenario
  const canSubmit = !!prompt.trim() && !!templateId

  return (
    <div className="flex h-full flex-col">
      <DraftBar current="v5" />
      <div className="custom-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[1440px] flex-wrap gap-8 px-8 py-7">
          <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-7">
            <h1 className="text-[22px] font-bold text-text-primary">문서 생성</h1>

            <Step n={1} title="무엇을 쓸지 알려주세요">
              <div className="rounded-2xl border border-surface-border focus-within:border-brand">
                <label htmlFor="v5-prompt" className="sr-only">프롬프트</label>
                <textarea id="v5-prompt" key={prompt} defaultValue={prompt} rows={3} placeholder="요청 내용을 적고, 참고할 자료가 있으면 첨부하세요"
                  className="w-full resize-none bg-transparent px-4 pt-4 text-[14.5px] leading-relaxed text-text-primary outline-none placeholder:text-text-muted" />
                {attachments.length > 0 && <div className="flex flex-wrap gap-2 px-3">{attachments.map((a) => <AttachmentChip key={a.name} {...a} />)}</div>}
                <div className="flex flex-wrap items-center gap-1 px-2 pb-2 pt-1">
                  <button type="button" aria-label="파일 첨부" className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted hover:bg-brand-subtle hover:text-brand"><ClipIcon className="h-4 w-4" /></button>
                  <DomainOption code={templateId ? 'TECH' : null} />
                  <OptionChip label={templateId ? '한글(HWPX)' : '출력 형식'} />
                  <OptionChip label={templateId ? '분량 보통' : '분량'} />
                </div>
              </div>
            </Step>

            <Step n={2} title="양식을 고르세요">
              <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {TEMPLATES.map((t) => {
                  const on = t.template_id === templateId
                  return (
                    <button key={t.template_id} type="button" aria-pressed={on}
                      className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors ${on ? 'border-brand bg-brand-subtle' : 'border-surface-border hover:border-brand-soft'}`}>
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${on ? 'bg-brand text-white' : 'bg-surface-card1 text-text-muted'}`}><DocIcon className="h-5 w-5" /></span>
                      <span className="min-w-0">
                        <span className={`block text-[14px] font-bold ${on ? 'text-brand' : 'text-text-primary'}`}>{t.name}</span>
                        <span className="mt-0.5 block text-[12px] leading-snug text-text-muted">{t.description}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 flex justify-end">
                <button type="button" disabled={!canSubmit} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-gradient-to-r from-brand to-brand-light px-6 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(220,20,60,0.28)] disabled:from-surface-subtle disabled:to-surface-subtle disabled:text-text-muted disabled:shadow-none">
                  <ArrowUpIcon className="h-4 w-4" /> 생성 요청
                </button>
              </div>
            </Step>

            <Step n={3} title="진행 상황">
              {jobs.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-surface-border px-5 py-8 text-center text-[13px] text-text-muted">요청하면 단계별 진행이 여기에 보입니다.</p>
              ) : (
                <ol className="relative ml-1 border-l-2 border-surface-subtle">
                  {jobs.map((job) => {
                    const s = normalizeJobStatus(job.status)
                    const on = job.job_id === selected?.job_id
                    return (
                      <li key={job.job_id} className="relative pb-5 pl-6 last:pb-0">
                        <span className={`absolute -left-[7px] top-4 h-3 w-3 rounded-full border-2 border-surface ${s === 'completed' ? 'bg-status-ok' : s === 'failed' ? 'bg-status-error' : s === 'running' ? 'bg-brand' : 'bg-text-muted'}`} />
                        <div className={`rounded-2xl border p-4 ${on ? 'border-brand bg-brand-subtle/40' : 'border-surface-border'}`}>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="min-w-0 flex-1 truncate text-[14px] font-semibold text-text-primary">{job.title}</p>
                            <StatusBadge job={job} />
                          </div>
                          <p className="mt-0.5 text-[11.5px] text-text-muted">{job.template_name} · 첨부 {job.attachments.length}개 · {formatClock(job.created_at)}</p>
                          {(s === 'running' || s === 'queued' || on) && <div className="mt-3"><StageSteps job={job} /></div>}
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-text-secondary">
                            {s === 'failed' ? <span className="text-status-error">{getJobErrorMessage(job.error?.code)}</span> : <JobProgressText job={job} />}
                            <JobActions job={job} />
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </Step>
          </div>

          <aside aria-label="미리보기" className="flex min-w-0 flex-[1_1_440px] flex-col overflow-hidden rounded-[20px] border border-surface-border lg:sticky lg:top-0 lg:max-h-[calc(100vh-110px)]">
            <div className="flex flex-wrap items-center gap-2 px-5 pt-4">
              <h2 className="min-w-0 flex-1 truncate text-[15px] font-bold text-text-primary">{selected ? selected.title : '미리보기'}</h2>
              <PreviewActions job={selected} />
            </div>
            <div role="tablist" className="mt-3 flex gap-1 border-b border-surface-border px-4 text-[13px]">
              {['문서', `근거 ${selected?.result?.sources_count ?? 0}`, '요청 정보'].map((t, i) => (
                <button key={t} role="tab" type="button" aria-selected={i === 0} className={`px-3 pb-2.5 font-semibold ${i === 0 ? 'border-b-2 border-brand text-brand' : 'text-text-muted hover:text-text-primary'}`}>{t}</button>
              ))}
            </div>
            <div className="custom-scroll flex flex-1 items-start justify-center overflow-y-auto bg-surface-card1 p-6">
              <PreviewBody job={selected} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
