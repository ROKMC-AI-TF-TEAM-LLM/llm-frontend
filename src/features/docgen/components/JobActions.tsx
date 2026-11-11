import type { DocGenJob } from '../types'
import { normalizeJobStatus } from '../utils'
import {
  useCancelDocGenJob,
  useDeleteDocGenJob,
  useRetryDocGenJob,
} from '../hooks'
import { showToast } from '@/shared/store/toastStore'
import { confirm } from '@/shared/store/confirmStore'
import {
  DownloadIcon,
  RetryIcon,
  StopIcon,
  TrashIcon,
} from '@/shared/components/icons'
import { Spinner } from './JobStatus'
import Button from '@/shared/components/Button'
import IconButton from '@/shared/components/IconButton'

/* ───────── 작업 액션 (진행 상황 목록에서, 상태별로 바뀜) ───────── */
// TODO(백엔드 연결): 결과 파일 다운로드 엔드포인트가 정해지면 연결한다
export function DownloadButton({
  job,
  primary = false,
}: {
  job: DocGenJob
  primary?: boolean
}) {
  return (
    <Button
      variant={primary ? 'primary' : 'secondary'}
      size="sm"
      aria-label={`${job.result?.file_name ?? job.title} 다운로드`}
    >
      <DownloadIcon className="h-3.5 w-3.5" /> 다운로드
    </Button>
  )
}

const REQUEST_FAILED = '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'

/**
 * 삭제 버튼. 되돌릴 수 없으므로 다른 화면의 삭제와 같이 확인 창으로 한 번 더 묻는다.
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

  const handleDelete = async () => {
    const ok = await confirm({
      title: `'${job.title}'을(를) 삭제하시겠습니까?`,
      message: '삭제한 문서는 되돌릴 수 없습니다.',
      danger: true,
    })
    if (!ok) return
    remove.mutateAsync(job.job_id).then(
      () => onDeleted?.(job.job_id),
      () => showToast(REQUEST_FAILED),
    )
  }

  const iconSize = large ? 'h-4 w-4' : 'h-3.5 w-3.5'
  return (
    <IconButton
      size={large ? 'lg' : 'md'}
      danger
      label={`${job.title} 삭제`}
      disabled={remove.isPending}
      onClick={handleDelete}
    >
      {remove.isPending ? (
        <Spinner className={iconSize} />
      ) : (
        <TrashIcon className={iconSize} />
      )}
    </IconButton>
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
      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => cancel.mutate(job.job_id, onError)}
      >
        {s === 'running' && <StopIcon className="h-3 w-3" />}{' '}
        {s === 'queued' ? '취소' : '중지'}
      </Button>
    )
  return (
    <span className="inline-flex items-center gap-1">
      {s === 'completed' ? (
        <DownloadButton job={job} />
      ) : (
        <Button
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => retry.mutate(job.job_id, onError)}
        >
          <RetryIcon className="h-3.5 w-3.5" /> 재시도
        </Button>
      )}
      <DeleteButton job={job} onDeleted={onDeleted} />
    </span>
  )
}
