// TEMP(시안 비교용) v1 기본형: 와이어프레임 그대로. 왼쪽 입력·양식 카드·진행 상황 목록, 오른쪽 고정 미리보기
import { getDomainStyle } from '../../../utils/document'
import { normalizeJobStatus } from '../../../utils/docgen'
import { selectable, useDocGenPage } from '../../../features/docgen/hooks'
import { ArrowUpIcon, DocIcon } from '../../../features/docgen/icons'
import {
  ComposerOptions, JobActions, JobMeta, JobProgressText, PreviewActions, PreviewBody, ProgressBar, StatusBadge,
} from '../../../features/docgen/components'
import DraftBar from './DraftBar'
import { useFreshDraft } from './draftState'

export default function DraftV1() {
  useFreshDraft()
  const { jobs, c, selected, select, isFresh, send } = useDocGenPage()

  return (
    <div className="flex h-full flex-col">
      <DraftBar current="v1" />
      <div className="custom-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[1440px] flex-wrap gap-6 px-8 py-7">
          {/* 왼쪽 */}
          <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-6">
            <header>
              <h1 className="text-[22px] font-bold text-text-primary">문서 생성</h1>
              <p className="mt-1 text-[13px] text-text-muted">요청을 적고 양식을 고르면 MARS가 문서 초안을 만들어 드립니다.</p>
            </header>

            <section aria-label="프롬프트 입력" className="rounded-[22px] border border-surface-border bg-surface transition-colors focus-within:border-brand">
              <label htmlFor="v1-prompt" className="sr-only">프롬프트</label>
              <textarea
                id="v1-prompt"
                rows={3}
                value={c.prompt}
                onChange={(e) => c.setPrompt(e.target.value)}
                placeholder="어떤 문서를 만들지 적어주세요. 예) 3분기 보안 점검 결과 보고서를 써줘"
                className="w-full resize-none bg-transparent px-5 pt-5 text-[15px] leading-relaxed text-text-primary outline-none placeholder:text-text-muted"
              />
              <div className="flex flex-wrap items-center gap-1 px-3 pb-3 pt-2">
                <ComposerOptions c={c} />
                <span className="flex-1" />
                <button
                  type="button"
                  disabled={!c.canSubmit}
                  onClick={send}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-r from-brand to-brand-light px-5 text-[14px] font-bold text-white transition hover:brightness-105 disabled:from-surface-subtle disabled:to-surface-subtle disabled:text-text-muted"
                >
                  <ArrowUpIcon className="h-4 w-4" /> 생성
                </button>
              </div>
            </section>

            <section aria-label="양식 선택">
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-text-primary">양식</h2>
                <button type="button" className="text-[12.5px] font-semibold text-text-muted hover:text-brand">양식 전체 보기</button>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-2.5">
                {c.templates.map((t) => {
                  const on = t.template_id === c.templateId
                  return (
                    <button
                      key={t.template_id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => c.pickTemplate(t.template_id)}
                      className={`group flex flex-col gap-2 rounded-2xl border p-2.5 text-left transition-colors ${on ? 'border-brand bg-brand-subtle' : 'border-surface-border hover:border-brand-soft'}`}
                    >
                      <span className={`flex aspect-[4/3] items-center justify-center rounded-xl ${on ? 'bg-surface' : 'bg-surface-card1'}`}>
                        <DocIcon className={`h-6 w-6 ${on ? 'text-brand' : 'text-text-hint'}`} />
                      </span>
                      <span className={`px-0.5 text-[13px] font-semibold ${on ? 'text-brand' : 'text-text-primary'}`}>{t.name}</span>
                    </button>
                  )
                })}
              </div>
            </section>

            <section aria-label="진행 상황" className="rounded-[20px] border border-surface-border">
              <div className="flex items-center gap-2 border-b border-surface-border px-5 py-3">
                <h2 className="text-[15px] font-bold text-text-primary">진행 상황</h2>
                <span className="text-[12.5px] text-text-muted">{jobs.length}건</span>
              </div>
              {jobs.length === 0 ? (
                <p className="px-5 py-12 text-center text-[13px] text-text-muted">아직 생성 요청이 없습니다. 요청하면 여기에 한 줄씩 쌓입니다.</p>
              ) : (
                <ul>
                  {jobs.map((job) => {
                    const s = normalizeJobStatus(job.status)
                    const on = job.job_id === selected?.job_id
                    return (
                      <li key={job.job_id} aria-pressed={on} {...selectable(() => select(job.job_id))} className={`flex cursor-pointer items-center gap-3 border-b border-surface-border px-5 py-3 last:border-b-0 ${on ? 'bg-brand-subtle/50' : 'hover:bg-surface-card1'} ${isFresh(job.job_id) ? 'animate-docgen-row-in' : ''}`}>
                        <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: getDomainStyle(job.domain).bar }} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold text-text-primary">{job.title}</p>
                          <JobMeta job={job} />
                          {s === 'running' && <ProgressBar value={job.progress} className="mt-1.5 max-w-[240px]" />}
                        </div>
                        <span className="hidden w-[190px] shrink-0 text-[12px] text-text-secondary sm:block"><JobProgressText job={job} /></span>
                        <StatusBadge job={job} />
                        <span onClick={(e) => e.stopPropagation()}><JobActions job={job} /></span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </div>

          {/* 오른쪽 미리보기 */}
          <aside aria-label="미리보기" className="flex min-w-0 flex-[1_1_440px] flex-col overflow-hidden rounded-[20px] border border-surface-border lg:sticky lg:top-0 lg:max-h-[calc(100vh-110px)]">
            <div className="flex flex-wrap items-center gap-2 border-b border-surface-border px-5 py-3">
              <h2 className="min-w-0 flex-1 truncate text-[15px] font-bold text-text-primary">{selected ? selected.title : '미리보기'}</h2>
              <PreviewActions job={selected} />
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
