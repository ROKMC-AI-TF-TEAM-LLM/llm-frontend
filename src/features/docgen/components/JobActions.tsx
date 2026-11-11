import { useEffect, useRef, useState } from 'react'
import type { DocGenJob } from '../types'
import { normalizeJobStatus } from '../utils'
import {
  useCancelDocGenJob,
  useDeleteDocGenJob,
  useRetryDocGenJob,
} from '../hooks'
import { showToast } from '@/shared/store/toastStore'
import {
  DownloadIcon,
  RetryIcon,
  StopIcon,
  TrashAltIcon,
} from '@/shared/components/icons'
import { Spinner } from './JobStatus'

/* ───────── 작업 액션 (진행 상황 목록에서, 상태별로 바뀜) ───────── */
const ghostBtn =
  'inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-lg border px-2.5 text-[12.5px] font-semibold transition-colors disabled:opacity-50'

// TODO(백엔드 연결): 결과 파일 다운로드 엔드포인트가 정해지면 연결한다
export function DownloadButton({
  job,
  primary = false,
}: {
  job: DocGenJob
  primary?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={`${job.result?.file_name ?? job.title} 다운로드`}
      className={`${ghostBtn} ${primary ? 'border-brand bg-brand text-white hover:bg-brand-hover' : 'border-brand-soft text-brand hover:bg-brand-subtle'}`}
    >
      <DownloadIcon className="h-3.5 w-3.5" /> 다운로드
    </button>
  )
}

const REQUEST_FAILED = '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'

/**
 * 삭제 버튼. 되돌릴 수 없으므로 그 자리에서 한 번 더 묻는다
 * (휴지통 → "삭제" 확인 + 취소). 4초 동안 고르지 않거나 Esc를 누르면 원래대로 돌아간다.
 * onDeleted는 삭제가 끝난 뒤 부른다. 목록이 다시 그려져 이 버튼이 사라진 뒤에도 불린다.
 */
export function DeleteButton({
  job,
  onDeleted,
  large = false,
}: {
  job: DocGenJob
  onDeleted?: (jobId: string) => void
  large?: boolean
}) {
  const remove = useDeleteDocGenJob()
  const [confirming, setConfirming] = useState(false)
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!confirming) return
    confirmRef.current?.focus()
    const id = window.setTimeout(() => setConfirming(false), 4000)
    return () => window.clearTimeout(id)
  }, [confirming])

  const size = large ? 'h-10 px-4 text-[13.5px]' : 'h-8 px-2.5 text-[12.5px]'
  if (!confirming)
    return (
      <button
        type="button"
        aria-label={`${job.title} 삭제`}
        title="삭제"
        disabled={remove.isPending}
        onClick={() => setConfirming(true)}
        className={`inline-flex shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-status-error/10 hover:text-status-error disabled:opacity-50 ${large ? 'h-10 w-10' : 'h-8 w-8'}`}
      >
        <TrashAltIcon className={large ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      </button>
    )

  const doDelete = () => {
    remove.mutateAsync(job.job_id).then(
      () => onDeleted?.(job.job_id),
      () => {
        setConfirming(false)
        showToast(REQUEST_FAILED)
      },
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1"
      onKeyDown={(e) => {
        if (e.key === 'Escape') setConfirming(false)
      }}
    >
      <button
        ref={confirmRef}
        type="button"
        disabled={remove.isPending}
        onClick={doDelete}
        className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-status-error font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 ${size}`}
      >
        {remove.isPending ? (
          <Spinner className="h-3 w-3" />
        ) : (
          <TrashAltIcon className="h-3.5 w-3.5" />
        )}{' '}
        삭제
      </button>
      <button
        type="button"
        disabled={remove.isPending}
        onClick={() => setConfirming(false)}
        className={`whitespace-nowrap rounded-full font-semibold text-text-secondary transition-colors hover:bg-surface-subtle ${size}`}
      >
        취소
      </button>
    </span>
  )
}

export function JobActions({
  job,
  onDeleted,
}: {
  job: DocGenJob
  onDeleted?: (jobId: string) => void
}) {
  const cancel = useCancelDocGenJob()
  const retry = useRetryDocGenJob()
  const busy = cancel.isPending || retry.isPending
  const onError = { onError: () => showToast(REQUEST_FAILED) }
  const s = normalizeJobStatus(job.status)
  if (s === 'queued' || s === 'running')
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => cancel.mutate(job.job_id, onError)}
        className={`${ghostBtn} border-surface-border text-text-secondary hover:bg-surface-subtle`}
      >
        {s === 'running' && <StopIcon className="h-3 w-3" />}{' '}
        {s === 'queued' ? '취소' : '중지'}
      </button>
    )
  return (
    <span className="inline-flex items-center gap-1">
      {s === 'completed' ? (
        <DownloadButton job={job} />
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => retry.mutate(job.job_id, onError)}
          className={`${ghostBtn} border-brand-soft text-brand hover:bg-brand-subtle`}
        >
          <RetryIcon className="h-3.5 w-3.5" /> 재시도
        </button>
      )}
      <DeleteButton job={job} onDeleted={onDeleted} />
    </span>
  )
}
