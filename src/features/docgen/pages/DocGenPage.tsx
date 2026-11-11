// 문서 제작 화면
//   첫 화면   → 가운데 한 열(제목·입력창). 생성 문서는 문서가 생긴 뒤에야 나타난다
//   전송      → 오른쪽 미리보기가 자연스럽게 밀려 나오고, 문서 자리에는 스켈레톤이 깔린다
//   생성 중   → 왼쪽 진행 상황에서 대기·진행률·취소를 보여 준다
//   완료      → 스켈레톤이 걷히며 문서가 그대로 드러나고, 작업은 생성 문서 목록으로 내려간다
// 진행은 서버 작업 상태를 그대로 따른다. (목 서버에서는 결과가 무작위이고, 프롬프트에 '실패'·'취소'를 넣으면 고정된다)
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { DocGenJob } from '../types'
import { normalizeJobStatus } from '../utils'
import { AI_NOTICE } from '@/shared/constants'
import { formatFileSize } from '@/shared/utils/fileSize'
import { getDomainStyle } from '@/features/domains/utils'
import { useDocGenJobs, selectable, useComposer, useFreshIds } from '../hooks'
import {
  ArrowUpIcon,
  CloseIcon,
  DocumentIcon,
  DownloadIcon,
} from '@/shared/components/icons'
import { ComposerOptions } from '../components/Picker'
import { DeleteButton, JobActions } from '../components/JobActions'
import {
  JobMeta,
  JobProgressText,
  ProgressBar,
  Spinner,
  StatusBadge,
  StatusDot,
} from '../components/JobStatus'
import { PreviewBody } from '../components/Preview'
import '../styles.css'

const motion =
  'duration-500 ease-[cubic-bezier(.4,0,.2,1)] motion-reduce:transition-none'

/**
 * 위쪽 여백. 아직 아무 작업도 없으면 새 채팅 화면처럼 입력창을 세로 가운데쯤에 두고,
 * 작업이 생기거나 미리보기가 열리면 아래 목록·미리보기 자리를 위해 위로 올린다.
 * (제목+입력창 높이 ≈ 250px, 눈으로 보기에 가운데보다 살짝 위)
 */
const TOP = {
  idle: 'max(10vh, calc(50vh - 160px))',
  busy: '10vh',
}

/** 왼쪽 작업 영역 : 오른쪽 미리보기 비율 */
const COLUMNS = {
  closed: 'minmax(0,1fr) minmax(0,0fr)',
  open: 'minmax(0,0.9fr) minmax(0,1.1fr)',
}

const isActive = (job: DocGenJob) => {
  const s = normalizeJobStatus(job.status)
  return s === 'queued' || s === 'running'
}

/** 높이 0 ↔ 내용 높이로 부드럽게 접고 펴기 */
const Collapse = ({
  open,
  children,
}: {
  open: boolean
  children: ReactNode
}) => (
  <div
    aria-hidden={!open}
    inert={!open}
    className={`grid transition-[grid-template-rows,opacity] ${motion} ${open ? 'opacity-100' : 'opacity-0'}`}
    style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
  >
    <div className="min-h-0 overflow-hidden">{children}</div>
  </div>
)

/** 처음 그려질 때 살짝 떠오르며 나타난다 (스켈레톤 → 문서 전환) */
function FadeIn({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <div
      className={`transition-[opacity,transform] ${motion} ${shown ? 'translate-y-0 opacity-100' : 'translate-y-1.5 opacity-0'}`}
    >
      {children}
    </div>
  )
}

/* ───────── 미리보기 ───────── */
const Bone = ({ className }: { className: string }) => (
  <span
    className={`block animate-pulse rounded bg-surface-subtle ${className}`}
  />
)

/** 스켈레톤 문단 모양: 소제목 폭과 본문 줄 폭 */
const SKELETON = [
  { head: '30%', lines: ['100%', '88%', '64%'] },
  { head: '24%', lines: ['100%', '92%'] },
  { head: '28%', lines: ['100%', '76%', '84%', '48%'] },
]

/** 문서가 만들어지는 동안 종이 자리에 까는 스켈레톤 */
function SkeletonPaper() {
  return (
    <article
      aria-busy="true"
      aria-label="문서 작성 중"
      className="mx-auto aspect-[1/1.414] w-full max-w-[460px] overflow-hidden rounded-[4px] border border-surface-border bg-surface p-6 shadow-sm"
    >
      <Bone className="mx-auto h-4 w-2/5" />
      <Bone className="mx-auto mt-2 h-2.5 w-1/4" />
      <div className="mt-7 space-y-6">
        {SKELETON.map(({ head, lines }, i) => (
          <div key={i} className="space-y-2.5">
            <span
              className="block h-3 animate-pulse rounded bg-surface-subtle"
              style={{ width: head }}
            />
            {lines.map((w, j) => (
              <span
                key={j}
                className="block h-2 animate-pulse rounded bg-surface-subtle"
                style={{ width: w }}
              />
            ))}
          </div>
        ))}
      </div>
    </article>
  )
}

function PreviewPanel({
  job,
  pending,
  onClose,
  onDeleted,
}: {
  job: DocGenJob | null
  pending: boolean
  onClose: () => void
  onDeleted: (jobId: string) => void
}) {
  const s = job ? normalizeJobStatus(job.status) : null
  const r = s === 'completed' ? job?.result : undefined
  const building = pending || s === 'queued' || s === 'running'
  return (
    <div className="flex h-full flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${motion} ${r ? 'bg-brand text-white' : 'bg-surface-card1 text-text-muted'}`}
        >
          {building ? (
            <Spinner className="h-4 w-4 text-brand" />
          ) : (
            <DocumentIcon className="h-5 w-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          {job ? (
            <>
              <p className="truncate text-15 font-bold text-text-primary">
                {r?.file_name ?? job.title}
              </p>
              <p className="mt-0.5 text-12 text-text-secondary">
                {r
                  ? `${job.output_format} · ${formatFileSize(r.size) ?? '-'} · ${r.page_count}쪽`
                  : `${job.template_name} · ${job.output_format}${building ? ' · 작성 중' : ''}`}
              </p>
            </>
          ) : (
            <>
              <Bone className="h-4 w-40" />
              <Bone className="mt-2 h-3 w-24" />
            </>
          )}
        </div>
        <div className="flex gap-2">
          {r && (
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-brand px-5 text-[13.5px] font-bold text-white shadow-[0_6px_16px_rgba(220,20,60,0.25)] transition-colors hover:bg-brand-hover"
            >
              <DownloadIcon className="h-4 w-4" /> 다운로드
            </button>
          )}
          {job && !building && (
            <DeleteButton job={job} onDeleted={onDeleted} large />
          )}
          <button
            type="button"
            aria-label="미리보기 닫기"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-primary"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <section
        aria-label="미리보기"
        className="custom-scroll min-h-0 flex-1 overflow-y-auto rounded-2xl border border-surface-border bg-surface-card1 p-4 sm:p-6"
      >
        {building || !job ? (
          <SkeletonPaper />
        ) : (
          // 상태가 바뀔 때마다 새로 그려 스켈레톤이 걷히고 문서가 떠오르게 한다
          <FadeIn key={`${job.job_id}-${s}`}>
            <PreviewBody job={job} compact />
          </FadeIn>
        )}
      </section>
    </div>
  )
}

/* ───────── 진행 상황 ───────── */
function ProgressSection({
  jobs,
  viewId,
  onSelect,
  isFresh,
}: {
  jobs: DocGenJob[]
  viewId: string | null
  onSelect: (id: string) => void
  isFresh: (id: string) => boolean
}) {
  return (
    <section
      aria-label="진행 상황"
      className="rounded-[20px] border border-surface-border"
    >
      <div className="flex items-center gap-2 border-b border-surface-border px-5 py-3">
        <h2 className="text-15 font-bold text-text-primary">진행 상황</h2>
        <span className="text-[12.5px] text-text-muted">{jobs.length}건</span>
      </div>
      <ul>
        {jobs.map((job) => {
          const on = job.job_id === viewId
          return (
            <li
              key={job.job_id}
              aria-pressed={on}
              {...selectable(() => onSelect(job.job_id))}
              className={`flex cursor-pointer items-center gap-3 border-b border-surface-border px-5 py-3 last:border-b-0 ${on ? 'bg-brand-subtle/50' : 'hover:bg-surface-card1'} ${isFresh(job.job_id) ? 'animate-docgen-row-in' : ''}`}
            >
              <span
                className="h-9 w-1 shrink-0 rounded-full"
                style={{ background: getDomainStyle(job.domain).bar }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-14 font-semibold text-text-primary">
                  {job.title}
                </p>
                <JobMeta job={job} />
                {normalizeJobStatus(job.status) === 'running' && (
                  <ProgressBar
                    value={job.progress}
                    className="mt-1.5 max-w-[240px]"
                  />
                )}
              </div>
              {/* 예상·남은 시간은 보여 주지 않는다 */}
              <span className="hidden w-[190px] shrink-0 text-12 text-text-secondary sm:block">
                {normalizeJobStatus(job.status) === 'queued' ? (
                  `대기 중 · 앞에 ${job.queue_position ?? 0}건`
                ) : (
                  <span className="tabular-nums">{job.progress}%</span>
                )}
              </span>
              <StatusBadge job={job} />
              <span
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <JobActions job={job} />
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/* ───────── 화면 ───────── */
function Stage() {
  const { jobs, isLoading } = useDocGenJobs()
  const c = useComposer()
  const isFresh = useFreshIds(
    jobs.map((j) => j.job_id),
    !isLoading,
  )
  const [sideOpen, setSideOpen] = useState(false)
  // 미리보기에 띄운 작업. 보내면 새 작업, 목록에서 고르면 그 작업
  const [viewId, setViewId] = useState<string | null>(null)
  // 요청 응답을 기다리는 중 (미리보기는 이미 열려 스켈레톤을 보여 준다)
  const [pending, setPending] = useState(false)
  const viewed = jobs.find((j) => j.job_id === viewId) ?? null
  // 삭제는 비동기라 끝났을 때의 viewId를 봐야 한다
  const viewIdRef = useRef(viewId)
  useEffect(() => {
    viewIdRef.current = viewId
  }, [viewId])

  const activeJobs = jobs.filter(isActive)
  const doneJobs = jobs.filter((j) => !isActive(j))

  const send = async () => {
    if (!c.canSubmit || pending) return
    setPending(true)
    setViewId(null)
    setSideOpen(true)
    const job = await c.submit()
    setPending(false)
    if (job) setViewId(job.job_id)
    else setSideOpen(false)
  }

  const view = (id: string) => {
    setViewId(id)
    setSideOpen(true)
  }

  // 미리보기에 띄운 문서를 지우면 미리보기도 닫는다
  const onDeleted = (id: string) => {
    if (id === viewIdRef.current) setSideOpen(false)
  }

  const idle = jobs.length === 0 && !sideOpen

  return (
    <div
      className={`mx-auto w-full max-w-[1360px] px-4 pb-16 sm:px-6 lg:grid transition-[grid-template-columns,column-gap,padding-top] ${motion}`}
      style={{
        gridTemplateColumns: sideOpen ? COLUMNS.open : COLUMNS.closed,
        columnGap: sideOpen ? 32 : 0,
        paddingTop: idle ? TOP.idle : TOP.busy,
      }}
    >
      <div className="mx-auto flex w-full min-w-0 max-w-[720px] flex-col">
        <h1 className="text-center text-[24px] font-bold text-text-primary sm:text-[28px]">
          어떤 <span className="text-brand">문서</span>를 만들까요?
        </h1>
        <p className="mt-2 text-center text-[13.5px] text-text-secondary">
          요청을 적고 양식을 고르면 그 양식에 맞춰 초안을 써 드립니다.
        </p>

        <section
          aria-label="문서 요청"
          className="mt-7 rounded-[28px] border border-brand-soft bg-surface shadow-[0_12px_30px_rgba(220,20,60,0.05)] transition-colors focus-within:border-brand"
        >
          <label htmlFor="docgen-prompt" className="sr-only">
            프롬프트
          </label>
          <textarea
            id="docgen-prompt"
            value={c.prompt}
            onChange={(e) => c.setPrompt(e.target.value)}
            rows={3}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="만들 문서를 설명해 주세요."
            className="w-full resize-none bg-transparent px-5 pt-5 text-15 leading-relaxed text-text-primary outline-none placeholder:text-text-muted sm:px-6"
          />
          <div className="flex flex-wrap items-center gap-1 px-3 pb-3 pt-2">
            <ComposerOptions c={c} withTemplate />
            <span className="flex-1" />
            <button
              type="button"
              aria-label="생성 요청"
              disabled={!c.canSubmit || pending}
              onClick={send}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${c.canSubmit && !pending ? 'bg-gradient-to-br from-brand to-brand-light text-white shadow-[0_5px_13px_rgba(220,20,60,0.28)] hover:brightness-105' : 'bg-surface-subtle text-text-muted'}`}
            >
              {pending ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <ArrowUpIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </section>

        {/* 진행 상황: 진행 중인 작업이 있을 때만 펼친다 */}
        <Collapse open={activeJobs.length > 0}>
          <div className="pt-6">
            <ProgressSection
              jobs={activeJobs}
              viewId={sideOpen ? viewId : null}
              onSelect={view}
              isFresh={isFresh}
            />
          </div>
        </Collapse>

        {/* 생성 문서: 문서가 생긴 뒤에야 나타난다 */}
        <Collapse open={doneJobs.length > 0}>
          <section aria-label="생성 문서" className="pt-10">
            <h2 className="mb-2 px-1 text-13 font-semibold text-text-muted">
              생성 문서 {doneJobs.length}
            </h2>
            <ul className="flex flex-col gap-0.5">
              {doneJobs.map((item) => {
                const on = sideOpen && viewId === item.job_id
                return (
                  <li
                    key={item.job_id}
                    className={
                      isFresh(item.job_id)
                        ? 'animate-docgen-row-in rounded-xl'
                        : ''
                    }
                  >
                    <div
                      aria-pressed={on}
                      {...selectable(() => view(item.job_id))}
                      className={`cursor-pointer rounded-xl px-3 py-2.5 transition-colors ${on ? 'bg-brand-subtle' : 'hover:bg-surface-card1'}`}
                    >
                      <div className="flex items-center gap-2">
                        <StatusDot job={item} />
                        <span
                          className={`min-w-0 flex-1 truncate text-[13.5px] font-semibold ${on ? 'text-brand' : 'text-text-primary'}`}
                        >
                          {item.title}
                        </span>
                        {isFresh(item.job_id) && (
                          <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[10.5px] font-bold text-white">
                            방금
                          </span>
                        )}
                        <span className="shrink-0 text-[11.5px] text-text-muted">
                          {item.template_name} · {item.output_format}
                        </span>
                      </div>
                      <div className="mt-1 flex min-h-8 items-center justify-between gap-2 pl-4 text-[11.5px] text-text-muted">
                        {/* 완료된 문서는 소요·완료 시각을 보여 주지 않는다 (실패·취소 사유만) */}
                        {normalizeJobStatus(item.status) === 'completed' ? (
                          <span />
                        ) : (
                          <JobProgressText job={item} />
                        )}
                        <span
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <JobActions job={item} onDeleted={onDeleted} />
                        </span>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        </Collapse>

        <p className="mt-6 text-center text-[11.5px] text-text-muted">
          {AI_NOTICE}
        </p>
      </div>

      {/* 오른쪽 미리보기: 보내면 오른쪽에서 밀려 나온다. 좁은 화면에서는 아래에 붙는다 */}
      <aside
        aria-label="미리보기"
        aria-hidden={!sideOpen}
        inert={!sideOpen}
        className={`min-w-0 transition-[opacity,transform] ${motion} ${sideOpen ? 'translate-x-0 opacity-100 max-lg:mt-8' : 'max-lg:hidden translate-x-8 opacity-0'}`}
      >
        <div className="overflow-hidden rounded-[20px] bg-surface shadow-[0_0_0_1px_var(--color-surface-border),0_12px_32px_rgba(0,0,0,0.06)] max-lg:h-[80vh] lg:sticky lg:top-6 lg:h-[calc(100vh-150px)] lg:min-h-[320px]">
          <PreviewPanel
            job={viewed}
            pending={pending}
            onClose={() => setSideOpen(false)}
            onDeleted={onDeleted}
          />
        </div>
      </aside>
    </div>
  )
}

export default function DocGenPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="custom-scroll min-h-0 flex-1 overflow-y-auto">
        <Stage />
      </div>
    </div>
  )
}
