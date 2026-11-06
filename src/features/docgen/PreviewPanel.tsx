import type { DocGenJob } from '../../types/docgen'
import { formatBytes, isJobActive, normalizeJobStatus } from '../../utils/docgen'
import { DocIcon, DownloadIcon, XIcon } from './icons'
import { PreviewBody, Spinner } from './components'
import { FadeIn, MOTION } from './motion'

const Bone = ({ className = '', width }: { className?: string; width?: string }) => (
  <span className={`block animate-pulse rounded bg-surface-subtle ${className}`} style={width ? { width } : undefined} />
)

/** 스켈레톤 문단 모양: 소제목 폭과 본문 줄 폭 */
const SKELETON = [
  { head: '30%', lines: ['100%', '88%', '64%'] },
  { head: '24%', lines: ['100%', '92%'] },
  { head: '28%', lines: ['100%', '76%', '84%', '48%'] },
]

/** 문서가 만들어지는 동안 종이 자리에 까는 스켈레톤 (Paper와 같은 크기) */
function SkeletonPaper() {
  return (
    <article aria-busy="true" aria-label="문서 작성 중" className="mx-auto aspect-[1/1.414] w-full max-w-[460px] overflow-hidden rounded-[4px] border border-surface-border bg-surface p-6 shadow-sm">
      <Bone className="mx-auto h-4 w-2/5" />
      <Bone className="mx-auto mt-2 h-2.5 w-1/4" />
      <div className="mt-7 space-y-6">
        {SKELETON.map(({ head, lines }, i) => (
          <div key={i} className="space-y-2.5">
            <Bone className="h-3" width={head} />
            {lines.map((w, j) => <Bone key={j} className="h-2" width={w} />)}
          </div>
        ))}
      </div>
    </article>
  )
}

/** 머리: 파일 아이콘 · 파일 이름 · 크기/쪽수 · 다운로드 · 닫기 */
function PreviewHeader({ job, building, onClose }: { job: DocGenJob | null; building: boolean; onClose: () => void }) {
  const result = job && normalizeJobStatus(job.status) === 'completed' ? job.result : undefined
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${MOTION} ${result ? 'bg-brand text-white' : 'bg-surface-card1 text-text-muted'}`}>
        {building ? <Spinner className="h-4 w-4 text-brand" /> : <DocIcon className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        {job ? (
          <>
            <p className="truncate text-[15px] font-bold text-text-primary">{result?.file_name ?? job.title}</p>
            <p className="mt-0.5 text-[12px] text-text-secondary">
              {result
                ? `${job.output_format} · ${formatBytes(result.size)} · ${result.page_count}쪽`
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
        {/* TODO(백엔드 연결): DownloadButton과 함께 다운로드 엔드포인트를 연결한다 */}
        {result && (
          <button type="button" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-brand px-5 text-[13.5px] font-bold text-white shadow-[0_6px_16px_rgba(220,20,60,0.25)] transition-colors hover:bg-brand-hover">
            <DownloadIcon className="h-4 w-4" /> 다운로드
          </button>
        )}
        <button type="button" aria-label="미리보기 닫기" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-primary">
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/**
 * 오른쪽 미리보기. 요청 응답 대기·대기·생성 중이면 스켈레톤을 깔고,
 * 끝나면 스켈레톤이 걷히며 문서(실패면 사유)가 떠오른다.
 */
export default function PreviewPanel({ job, pending, onClose }: { job: DocGenJob | null; pending: boolean; onClose: () => void }) {
  const building = pending || !job || isJobActive(job)
  return (
    <div className="flex h-full flex-col gap-4 p-5">
      <PreviewHeader job={job} building={building} onClose={onClose} />
      <section aria-label="미리보기" className="custom-scroll min-h-0 flex-1 overflow-y-auto rounded-2xl border border-surface-border bg-surface-card1 p-4 sm:p-6">
        {building || !job ? <SkeletonPaper /> : (
          // 작업이나 상태가 바뀌면 새로 그려 떠오르는 움직임을 다시 재생한다
          <FadeIn key={`${job.job_id}-${job.status}`}><PreviewBody job={job} compact /></FadeIn>
        )}
      </section>
    </div>
  )
}
