// TEMP(시안 비교용) v5 반응형 미리보기: v4 단계형을 토대로, 미리보기가 생기면 화면 배치가 따라 바뀐다.
//   작성(미리보기 없음)  → 가운데 한 줄로 입력에 집중
//   대기·생성 중         → 오른쪽에서 미리보기가 밀려 들어오고, 입력 단계는 요청 요약으로 접힌다
//   완료                 → 미리보기가 넓어지고 왼쪽은 작업 목록만 남는다
//   실패                 → 입력 단계가 다시 펼쳐져 고쳐서 다시 요청하게 한다
// 미리보기 닫기·작업 선택은 이 화면 안에서만 바뀐다 (상단 상태 막대를 누르면 초기화).
import { useState, type ReactNode } from 'react'
import type { DocGenJob } from '../../../types/docgen'
import { formatClock, getJobErrorMessage, normalizeJobStatus } from '../../../utils/docgen'
import { TEMPLATES, type Scenario } from './fixtures'
import { useDraftScenario } from './draftState'
import {
  ArrowUpIcon, AttachmentChip, ClipIcon, DocIcon, DomainOption, DraftBar, JobActions,
  JobProgressText, OptionChip, PreviewActions, PreviewBody, StageSteps, StatusBadge, XIcon,
} from './shared'

type Layout = 'compose' | 'watch' | 'review' | 'fix'

/** 왼쪽 작업 영역 : 오른쪽 미리보기 비율 */
const COLUMNS: Record<Layout, string> = {
  compose: 'minmax(0,1fr) minmax(0,0fr)',
  watch: 'minmax(0,1fr) minmax(0,1fr)',
  review: 'minmax(0,0.75fr) minmax(0,1.4fr)',
  fix: 'minmax(0,1.1fr) minmax(0,1fr)',
}

const layoutOf = (job: DocGenJob | null): Layout => {
  if (!job) return 'compose'
  const s = normalizeJobStatus(job.status)
  return s === 'completed' ? 'review' : s === 'failed' ? 'fix' : 'watch'
}

const motion = 'duration-500 ease-[cubic-bezier(.4,0,.2,1)] motion-reduce:transition-none'

/** 높이 0 ↔ 내용 높이로 부드럽게 접고 펴기 */
const Collapse = ({ open, children }: { open: boolean; children: ReactNode }) => (
  <div aria-hidden={!open} inert={!open} className={`grid transition-[grid-template-rows,opacity] ${motion} ${open ? 'opacity-100' : 'opacity-0'}`} style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
    <div className="min-h-0 overflow-hidden">{children}</div>
  </div>
)

const Step = ({ n, title, children }: { n: number; title: string; children: ReactNode }) => (
  <section className="flex gap-4">
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-[13px] font-bold text-white">{n}</span>
    <div className="min-w-0 flex-1">
      <h2 className="mb-3 mt-0.5 text-[15px] font-bold text-text-primary">{title}</h2>
      {children}
    </div>
  </section>
)

/** 입력 단계 1·2 (작성·실패일 때 펼쳐짐) */
function ComposeSteps({ scenario, fixing }: { scenario: Scenario; fixing: boolean }) {
  const { prompt, templateId, attachments } = scenario
  const canSubmit = !!prompt.trim() && !!templateId
  return (
    <div className="flex flex-col gap-7 pb-1">
      <Step n={1} title={fixing ? '요청을 고쳐 주세요' : '무엇을 쓸지 알려주세요'}>
        <div className={`rounded-2xl border focus-within:border-brand ${fixing ? 'border-status-error/40' : 'border-surface-border'}`}>
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
        {fixing && <p className="mt-2 text-[12.5px] text-status-error">읽지 못한 첨부를 빼거나 다른 파일로 바꾼 뒤 다시 요청하세요.</p>}
      </Step>

      <Step n={2} title="양식을 고르세요">
        <div className="grid gap-2.5 sm:grid-cols-2">
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
            <ArrowUpIcon className="h-4 w-4" /> {fixing ? '고쳐서 다시 요청' : '생성 요청'}
          </button>
        </div>
      </Step>
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
      <p className="mt-2 text-[11.5px] text-text-muted">{job.template_name} · {job.output_format} · 첨부 {job.attachments.length}개</p>
    </div>
  )
}

/** 진행 타임라인. 넓을 때는 단계까지, 좁을 때(완료 화면)는 한 줄씩 */
function JobTimeline({ jobs, selectedId, compact, onSelect }: { jobs: DocGenJob[]; selectedId?: string; compact: boolean; onSelect: (id: string) => void }) {
  if (jobs.length === 0)
    return <p className="rounded-2xl border border-dashed border-surface-border px-5 py-8 text-center text-[13px] text-text-muted">요청하면 단계별 진행이 여기에 보입니다.</p>
  return (
    <ol className="relative ml-1 border-l-2 border-surface-subtle">
      {jobs.map((job) => {
        const s = normalizeJobStatus(job.status)
        const on = job.job_id === selectedId
        return (
          <li key={job.job_id} className={`relative pl-6 last:pb-0 ${compact ? 'pb-2.5' : 'pb-5'}`}>
            <span className={`absolute -left-[7px] top-4 h-3 w-3 rounded-full border-2 border-surface ${s === 'completed' ? 'bg-status-ok' : s === 'failed' ? 'bg-status-error' : s === 'running' ? 'bg-brand' : 'bg-text-muted'}`} />
            <div role="button" tabIndex={0} aria-pressed={on} onClick={() => onSelect(job.job_id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(job.job_id) } }}
              className={`cursor-pointer rounded-2xl border transition-colors ${compact ? 'px-3.5 py-3' : 'p-4'} ${on ? 'border-brand bg-brand-subtle/40' : 'border-surface-border hover:border-brand-soft'}`}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-[14px] font-semibold text-text-primary">{job.title}</p>
                <StatusBadge job={job} />
              </div>
              <p className="mt-0.5 text-[11.5px] text-text-muted">{job.template_name} · 첨부 {job.attachments.length}개 · {formatClock(job.created_at)}</p>
              {!compact && (
                <>
                  {(s === 'running' || s === 'queued' || on) && <div className="mt-3"><StageSteps job={job} /></div>}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-text-secondary">
                    {s === 'failed' ? <span className="text-status-error">{getJobErrorMessage(job.error?.code)}</span> : <JobProgressText job={job} />}
                    <span onClick={(e) => e.stopPropagation()}><JobActions job={job} /></span>
                  </div>
                </>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default function DraftV5() {
  const { state, scenario } = useDraftScenario()

  // 화면 안에서 바꾼 값은 상단 상태 막대로 시나리오를 바꾸면 초기화된다
  const [picked, setPicked] = useState<{ state: string; id: string } | null>(null)
  const [closedFor, setClosedFor] = useState<string | null>(null)

  const pickedJob = picked?.state === state ? scenario.jobs.find((j) => j.job_id === picked.id) : undefined
  const selected = closedFor === state ? null : pickedJob ?? scenario.selected
  const layout = layoutOf(selected)
  const showPreview = layout !== 'compose'
  const composeOpen = layout === 'compose' || layout === 'fix'

  const select = (id: string) => {
    setPicked({ state, id })
    setClosedFor(null)
  }

  return (
    <div className="flex h-full flex-col">
      <DraftBar current="v5" />
      <div className="custom-scroll min-h-0 flex-1 overflow-y-auto">
        <div className={`mx-auto flex max-w-[1440px] flex-col gap-8 px-8 py-7 lg:grid lg:transition-[grid-template-columns] ${motion}`} style={{ gridTemplateColumns: COLUMNS[layout] }}>
          {/* 작업 영역: 미리보기가 없으면 가운데 좁은 폭으로 */}
          <div className="mx-auto flex w-full min-w-0 max-w-[760px] flex-col gap-7">
            <div className="flex items-end justify-between gap-3">
              <h1 className="text-[22px] font-bold text-text-primary">문서 생성</h1>
              {!showPreview && scenario.selected && (
                <button type="button" onClick={() => setClosedFor(null)} className="text-[12.5px] font-semibold text-brand hover:underline">미리보기 다시 열기</button>
              )}
            </div>

            <Collapse open={composeOpen}>
              <ComposeSteps scenario={scenario} fixing={layout === 'fix'} />
            </Collapse>

            <Collapse open={!composeOpen && !!selected}>
              {selected && <RequestSummary job={selected} onNew={() => setClosedFor(state)} />}
            </Collapse>

            <Step n={composeOpen ? 3 : 1} title={layout === 'review' ? '작업 목록' : '진행 상황'}>
              <JobTimeline jobs={scenario.jobs} selectedId={selected?.job_id} compact={layout === 'review'} onSelect={select} />
            </Step>
          </div>

          {/* 미리보기: 생기면 오른쪽에서 밀려 들어온다 */}
          <aside aria-label="미리보기" aria-hidden={!showPreview} inert={!showPreview}
            className={`min-w-0 transition-[opacity,transform] ${motion} ${showPreview ? 'translate-x-0 opacity-100' : 'max-lg:hidden translate-x-8 opacity-0'}`}>
            <div className="flex flex-col overflow-hidden rounded-[20px] border border-surface-border lg:sticky lg:top-0 lg:max-h-[calc(100vh-110px)]">
              <div className="flex flex-wrap items-center gap-2 px-5 pt-4">
                <h2 className="min-w-0 flex-1 truncate text-[15px] font-bold text-text-primary">{selected?.title ?? '미리보기'}</h2>
                <PreviewActions job={selected} />
                <button type="button" aria-label="미리보기 닫기" onClick={() => setClosedFor(state)} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-subtle hover:text-text-primary">
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
              <div role="tablist" className="mt-3 flex gap-1 border-b border-surface-border px-4 text-[13px]">
                {['문서', `근거 ${selected?.result?.sources_count ?? 0}`, '요청 정보'].map((t, i) => (
                  <button key={t} role="tab" type="button" aria-selected={i === 0} className={`px-3 pb-2.5 font-semibold ${i === 0 ? 'border-b-2 border-brand text-brand' : 'text-text-muted hover:text-text-primary'}`}>{t}</button>
                ))}
              </div>
              <div className="custom-scroll flex flex-1 items-start justify-center overflow-y-auto bg-surface-card1 p-6">
                <PreviewBody job={selected} compact={layout !== 'review'} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
