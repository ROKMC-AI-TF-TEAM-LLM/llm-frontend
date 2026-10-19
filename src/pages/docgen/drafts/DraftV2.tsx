// TEMP(시안 비교용) v2 표형: 관리자 문서 관리 톤. 양식은 알약 칩, 큐는 표, 미리보기는 메타 표 + 종이
import { getDomainLabel, getDomainStyle } from '../../../utils/document'
import { formatClock, normalizeJobStatus } from '../../../utils/docgen'
import DomainIcon from '../../../ui/components/chat/DomainIcon'
import { TEMPLATES } from './fixtures'
import { useDraftScenario } from './draftState'
import {
  ArrowUpIcon, AttachmentChip, ClipIcon, DomainOption, DraftBar, JobActions, JobProgressText,
  OptionChip, PreviewActions, PreviewBody, ProgressBar, StatusBadge,
} from './shared'

export default function DraftV2() {
  const { scenario } = useDraftScenario()
  const { selected, jobs, prompt, templateId, attachments } = scenario
  const canSubmit = !!prompt.trim() && !!templateId

  return (
    <div className="flex h-full flex-col">
      <DraftBar current="v2" />
      <div className="custom-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1440px] px-8 py-7">
          <h1 className="text-[22px] font-bold text-text-primary">문서 생성</h1>

          <div className="mt-5 flex border-b border-surface-border text-[14px]">
            <span className="border-b-2 border-brand px-3 pb-2.5 font-semibold text-brand">새 문서</span>
            <span className="px-3 pb-2.5 text-text-muted">내 문서함</span>
          </div>

          {/* 입력 띠 */}
          <section aria-label="프롬프트 입력" className="mt-5 rounded-2xl border border-surface-border bg-surface-card2 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12.5px] font-semibold text-text-secondary">양식</span>
              {TEMPLATES.map((t) => (
                <button
                  key={t.template_id}
                  type="button"
                  aria-pressed={t.template_id === templateId}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                    t.template_id === templateId ? 'bg-brand text-white' : 'bg-surface text-text-secondary hover:bg-brand-subtle hover:text-brand'
                  }`}
                >
                  {t.name}
                </button>
              ))}
              <span className="flex-1" />
              <DomainOption code={templateId ? 'TECH' : null} />
              <OptionChip label={templateId ? '한글(HWPX)' : '출력 형식'} />
              <OptionChip label={templateId ? '분량 보통' : '분량'} />
            </div>
            <div className="mt-3 flex items-end gap-3 rounded-xl border border-surface-border bg-surface p-3 focus-within:border-brand">
              <button type="button" aria-label="파일 첨부" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-brand-subtle hover:text-brand">
                <ClipIcon className="h-[18px] w-[18px]" />
              </button>
              <div className="min-w-0 flex-1">
                <label htmlFor="v2-prompt" className="sr-only">프롬프트</label>
                <textarea
                  id="v2-prompt"
                  key={prompt}
                  defaultValue={prompt}
                  rows={2}
                  placeholder="어떤 문서를 만들지 적어주세요"
                  className="w-full resize-none bg-transparent py-2 text-[14.5px] text-text-primary outline-none placeholder:text-text-muted"
                />
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-1">
                    {attachments.map((a) => <AttachmentChip key={a.name} {...a} />)}
                  </div>
                )}
              </div>
              <button type="button" disabled={!canSubmit} className="btn-primary h-10 shrink-0 gap-1.5 disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-text-muted">
                <ArrowUpIcon className="h-4 w-4" /> 생성
              </button>
            </div>
          </section>

          <div className="mt-6 flex flex-wrap gap-6">
            {/* 큐 표 */}
            <section aria-label="생성 큐" className="min-w-0 flex-[3_1_620px]">
              <div className="mb-3 flex items-center gap-1.5">
                {['전체', '진행', '완료', '실패'].map((f, i) => (
                  <button key={f} type="button" className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${i === 0 ? 'bg-brand text-white' : 'text-text-secondary hover:bg-brand-subtle hover:text-brand'}`}>{f}</button>
                ))}
              </div>
              <div className="overflow-x-auto rounded-2xl border border-surface-border">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="bg-surface-subtle text-[12.5px] text-text-muted">
                      <th className="px-5 py-3 text-left font-semibold">문서</th>
                      <th className="w-[110px] px-3 py-3 text-left font-semibold">도메인</th>
                      <th className="w-[90px] px-3 py-3 text-left font-semibold">상태</th>
                      <th className="w-[150px] px-3 py-3 text-left font-semibold">진행</th>
                      <th className="w-[70px] px-3 py-3 text-left font-semibold">요청</th>
                      <th className="w-[150px] px-5 py-3 text-right font-semibold">처리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.length === 0 ? (
                      <tr><td colSpan={6} className="px-5 py-12 text-center text-text-muted">아직 생성 요청이 없습니다.</td></tr>
                    ) : (
                      jobs.map((job) => {
                        const s = normalizeJobStatus(job.status)
                        const style = getDomainStyle(job.domain)
                        return (
                          <tr key={job.job_id} className={`border-t border-surface-border ${job.job_id === selected?.job_id ? 'bg-brand-subtle/50' : s === 'failed' ? 'bg-status-error/5' : 'hover:bg-surface-subtle/50'}`}>
                            <td className="px-5 py-3">
                              <div className="flex min-w-0 items-center gap-2.5">
                                <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: style.bar }} />
                                <div className="min-w-0">
                                  <p className="max-w-[300px] truncate font-semibold text-text-primary">{job.title}</p>
                                  <p className="text-[11.5px] text-text-muted">{job.template_name} · {job.output_format} · 첨부 {job.attachments.length}개</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              {job.domain && (
                                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: style.badgeText }}>
                                  <DomainIcon code={job.domain} size={14} />{getDomainLabel(job.domain)}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3"><StatusBadge job={job} /></td>
                            <td className="px-3 py-3 text-[12px] text-text-secondary">
                              <JobProgressText job={job} />
                              {s === 'running' && <ProgressBar value={job.progress} className="mt-1" />}
                            </td>
                            <td className="px-3 py-3 text-[12px] text-text-muted">{formatClock(job.created_at)}</td>
                            <td className="px-5 py-3 text-right"><JobActions job={job} /></td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 미리보기 */}
            <aside aria-label="미리보기" className="min-w-0 flex-[2_1_400px]">
              <div className="mb-3 flex h-[34px] items-center justify-between gap-2">
                <h2 className="truncate text-[15px] font-bold text-text-primary">{selected ? selected.title : '미리보기'}</h2>
                <PreviewActions job={selected} />
              </div>
              {selected && (
                <dl className="mb-4 overflow-hidden rounded-2xl bg-surface-subtle text-[13px]">
                  {[
                    ['양식', `${selected.template_name} · ${selected.output_format}`],
                    ['첨부', `${selected.attachments.length}개`],
                    ['요청', formatClock(selected.created_at)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-surface last:border-b-0 px-4 py-2.5">
                      <dt className="text-text-muted">{k}</dt><dd className="font-medium text-text-primary">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className="flex justify-center rounded-2xl border border-surface-border bg-surface-card1 p-5">
                <PreviewBody job={selected} compact />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
