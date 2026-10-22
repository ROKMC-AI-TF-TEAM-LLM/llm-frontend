// TEMP(시안 비교용) v5 반응형 미리보기: 미리보기가 생기면 화면 배치가 따라 바뀐다.
//   미리보기 없음          → 가운데 한 줄로 입력에 집중
//   미리보기 열림          → 오른쪽에서 미리보기가 밀려 들어오고, 입력 단계는 요청 요약으로 접힌다
//                            (어떤 상태의 문서를 골라도 미리보기 크기는 그대로)
//   실패한 문서를 고름     → 입력 단계가 다시 펼쳐져 고쳐서 다시 요청하게 한다
// 진행률은 미리보기가 아니라 왼쪽 진행 상황에서 보여 준다.
import type { ReactNode } from 'react'
import type { DocGenJob } from '../../../types/docgen'
import { getJobErrorMessage, normalizeJobStatus } from '../../../utils/docgen'
import { getDomainLabel } from '../../../utils/document'
import { selectable, useDocGenPage, type Composer } from '../../../features/docgen/hooks'
import { ArrowUpIcon, DocIcon, XIcon } from '../../../features/docgen/icons'
import {
  ComposerOptions, JobActions, JobMeta, JobProgressText, PreviewActions, PreviewBody, ProgressBar, StatusBadge,
} from '../../../features/docgen/components'
import DraftBar from './DraftBar'
import { useFreshDraft } from './draftState'

/** 왼쪽 작업 영역 : 오른쪽 미리보기 비율. 미리보기가 열려 있으면 고정 */
const COLUMNS = {
  closed: 'minmax(0,1fr) minmax(0,0fr)',
  open: 'minmax(0,1fr) minmax(0,1.2fr)',
}

const motion = 'duration-500 ease-[cubic-bezier(.4,0,.2,1)] motion-reduce:transition-none'

/** 높이 0 ↔ 내용 높이로 부드럽게 접고 펴기 */
const Collapse = ({ open, children }: { open: boolean; children: ReactNode }) => (
  <div aria-hidden={!open} inert={!open} className={`grid transition-[grid-template-rows,opacity] ${motion} ${open ? 'opacity-100' : 'opacity-0'}`} style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
    <div className="min-h-0 overflow-hidden">{children}</div>
  </div>
)

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="min-w-0">
    <h2 className="mb-3 text-[15px] font-bold text-text-primary">{title}</h2>
    {children}
  </section>
)

/** 입력 영역 (미리보기가 없거나 실패한 문서를 골랐을 때 펼쳐짐) */
function ComposeSteps({ c, fixing, onSend }: { c: Composer; fixing: boolean; onSend: () => void }) {
  return (
    <div className="flex flex-col gap-5 pb-1">
      <section aria-label="요청 내용">
        <div className={`rounded-2xl border focus-within:border-brand ${fixing ? 'border-status-error/40' : 'border-surface-border'}`}>
          <label htmlFor="v5-prompt" className="sr-only">프롬프트</label>
          <textarea id="v5-prompt" value={c.prompt} onChange={(e) => c.setPrompt(e.target.value)} rows={3} placeholder="만들 문서의 내용을 적어 주세요"
            className="w-full resize-none bg-transparent px-4 pt-4 text-[14.5px] leading-relaxed text-text-primary outline-none placeholder:text-text-muted" />
          <div className="flex flex-wrap items-center gap-1 px-2 pb-2 pt-1">
            <ComposerOptions c={c} />
          </div>
        </div>
        {fixing && <p className="mt-2 text-[12.5px] text-status-error">요청 내용이나 양식을 바꿔 다시 요청해 보세요.</p>}
      </section>

      <section aria-label="양식">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {c.templates.map((t) => {
            const on = t.template_id === c.templateId
            return (
              <button key={t.template_id} type="button" aria-pressed={on} onClick={() => c.pickTemplate(t.template_id)}
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
          <button type="button" disabled={!c.canSubmit} onClick={onSend} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-gradient-to-r from-brand to-brand-light px-6 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(220,20,60,0.28)] disabled:from-surface-subtle disabled:to-surface-subtle disabled:text-text-muted disabled:shadow-none">
            <ArrowUpIcon className="h-4 w-4" /> {fixing ? '고쳐서 다시 요청' : '생성 요청'}
          </button>
        </div>
      </section>
    </div>
  )
}

/** 입력 단계가 접혔을 때 남는 요청 요약 */
function RequestSummary({ job, onNew }: { job: DocGenJob; onNew: () => void }) {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface-card1/60 p-4">
      <div className="flex items-start gap-3">
        <p className="line-clamp-2 min-w-0 flex-1 text-[13.5px] leading-relaxed text-text-secondary">{job.prompt}</p>
        <button type="button" onClick={onNew} className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-brand-soft px-3 text-[12.5px] font-semibold text-brand hover:bg-brand-subtle">
          <ArrowUpIcon className="h-3.5 w-3.5" /> 새 요청
        </button>
      </div>
      <p className="mt-2 text-[11.5px] text-text-muted">{job.template_name} · {job.domain ? getDomainLabel(job.domain) : '전체 분야'} · {job.output_format}</p>
    </div>
  )
}

/** 진행 타임라인: 상태·진행률·작업 액션을 여기서 보여 준다 */
function JobTimeline({ jobs, selectedId, onSelect, isFresh }: {
  jobs: DocGenJob[]; selectedId?: string; onSelect: (id: string) => void; isFresh: (id: string) => boolean
}) {
  if (jobs.length === 0)
    return <p className="rounded-2xl border border-dashed border-surface-border px-5 py-8 text-center text-[13px] text-text-muted">요청하면 진행 상황이 여기에 보입니다.</p>
  return (
    <ol className="relative ml-1 border-l-2 border-surface-subtle">
      {jobs.map((job) => {
        const s = normalizeJobStatus(job.status)
        const on = job.job_id === selectedId
        return (
          <li key={job.job_id} className={`relative pb-4 pl-6 last:pb-0 ${isFresh(job.job_id) ? 'animate-docgen-row-in' : ''}`}>
            <span className={`absolute -left-[7px] top-4 h-3 w-3 rounded-full border-2 border-surface ${s === 'completed' ? 'bg-status-ok' : s === 'failed' ? 'bg-status-error' : s === 'running' ? 'bg-brand' : 'bg-text-muted'}`} />
            <div aria-pressed={on} {...selectable(() => onSelect(job.job_id))}
              className={`cursor-pointer rounded-2xl border p-4 transition-colors ${on ? 'border-brand bg-brand-subtle/40' : 'border-surface-border hover:border-brand-soft'}`}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-[14px] font-semibold text-text-primary">{job.title}</p>
                <StatusBadge job={job} />
              </div>
              <div className="mt-0.5"><JobMeta job={job} /></div>
              {s === 'running' && <ProgressBar value={job.progress} className="mt-3" />}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-text-secondary">
                {s === 'failed' ? <span className="text-status-error">{getJobErrorMessage(job.error?.code)}</span> : <JobProgressText job={job} />}
                <span onClick={(e) => e.stopPropagation()}><JobActions job={job} /></span>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default function DraftV5() {
  useFreshDraft()
  const { jobs, c, selected, select, close, isFresh, send } = useDocGenPage()
  const showPreview = !!selected
  const fixing = !!selected && normalizeJobStatus(selected.status) === 'failed'
  const composeOpen = !selected || fixing

  return (
    <div className="flex h-full flex-col">
      <DraftBar current="v5" />
      <div className="custom-scroll min-h-0 flex-1 overflow-y-auto">
        <div className={`mx-auto flex max-w-[1440px] flex-col gap-8 px-8 py-7 lg:grid lg:transition-[grid-template-columns] ${motion}`} style={{ gridTemplateColumns: showPreview ? COLUMNS.open : COLUMNS.closed }}>
          {/* 작업 영역: 미리보기가 없으면 가운데 좁은 폭으로 */}
          <div className="mx-auto flex w-full min-w-0 max-w-[760px] flex-col gap-7">
            <h1 className="text-[22px] font-bold text-text-primary">문서 생성</h1>

            <Collapse open={composeOpen}>
              <ComposeSteps c={c} fixing={fixing} onSend={send} />
            </Collapse>

            <Collapse open={!composeOpen}>
              {selected && <RequestSummary job={selected} onNew={close} />}
            </Collapse>

            <Section title="진행 상황">
              <JobTimeline jobs={jobs} selectedId={selected?.job_id} onSelect={select} isFresh={isFresh} />
            </Section>
          </div>

          {/* 미리보기: 생기면 오른쪽에서 밀려 들어온다. 열려 있는 동안 크기는 고정 */}
          <aside aria-label="미리보기" aria-hidden={!showPreview} inert={!showPreview}
            className={`min-w-0 transition-[opacity,transform] ${motion} ${showPreview ? 'translate-x-0 opacity-100' : 'max-lg:hidden translate-x-8 opacity-0'}`}>
            <div className="flex flex-col overflow-hidden rounded-[20px] border border-surface-border lg:sticky lg:top-0 lg:h-[calc(100vh-110px)]">
              <div className="flex flex-wrap items-center gap-2 border-b border-surface-border px-5 py-3">
                <h2 className="min-w-0 flex-1 truncate text-[15px] font-bold text-text-primary">{selected?.title ?? '미리보기'}</h2>
                <PreviewActions job={selected} />
                <button type="button" aria-label="미리보기 닫기" onClick={close} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-subtle hover:text-text-primary">
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="custom-scroll flex flex-1 items-start justify-center overflow-y-auto bg-surface-card1 p-6">
                <PreviewBody job={selected} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
