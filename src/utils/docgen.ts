import type { DocGenErrorCode, DocGenJob, DocGenLength, DocGenOutputFormat, DocGenStage } from '../types/docgen'

/**
 * 상태 흐름
 *
 *   (처음 idle) --생성--> 대기 queued --서버 시작--> 생성 중 running --> 완료 completed
 *                          |  취소                     |  중지/오류
 *                          +-------------------------> 실패 failed --재시도--> 대기 queued
 *
 * 서버 상태 문자열은 이 함수에서만 해석한다. 컴포넌트에서 'RUNNING' 같은 원문을 비교하지 않는다.
 */
export type JobState = 'queued' | 'running' | 'completed' | 'failed'

export const normalizeJobStatus = (status: string | null | undefined): JobState => {
  const s = String(status ?? '').toLowerCase()
  if (/(complete|success|done|ready)/.test(s)) return 'completed'
  if (/(fail|error|cancel|reject|timeout)/.test(s)) return 'failed'
  if (/(run|process|generat|progress|start)/.test(s)) return 'running'
  return 'queued'
}

export const isJobActive = (job: Pick<DocGenJob, 'status'>): boolean => {
  const state = normalizeJobStatus(job.status)
  return state === 'queued' || state === 'running'
}

/** 화면 상태: 선택된 작업이 없으면 처음(idle) */
export type PageState = 'idle' | JobState

export const getPageState = (job: Pick<DocGenJob, 'status'> | null | undefined): PageState =>
  job ? normalizeJobStatus(job.status) : 'idle'

export const JOB_STATE_LABEL: Record<JobState, string> = {
  queued: '대기',
  running: '생성 중',
  completed: '완료',
  failed: '실패',
}

export const STAGES: { code: DocGenStage; label: string }[] = [
  { code: 'ANALYZING', label: '자료 분석' },
  { code: 'DRAFTING', label: '초안 작성' },
  { code: 'FORMATTING', label: '서식 적용' },
]

/** 현재 단계의 순번(1부터). 모르면 1 */
export const getStageIndex = (stage: string | null | undefined): number => {
  const idx = STAGES.findIndex((s) => s.code === String(stage ?? '').toUpperCase())
  return idx === -1 ? 1 : idx + 1
}

export const OUTPUT_FORMATS: { code: DocGenOutputFormat; label: string }[] = [
  { code: 'HWPX', label: '한글(HWPX)' },
  { code: 'DOCX', label: '워드(DOCX)' },
  { code: 'PDF', label: 'PDF' },
]

export const LENGTHS: { code: DocGenLength; label: string }[] = [
  { code: 'SHORT', label: '짧게' },
  { code: 'NORMAL', label: '보통' },
  { code: 'LONG', label: '길게' },
]

/** 오류 코드별 문구. TODO(백엔드 확인): 실제 오류 코드 목록 */
const ERROR_MESSAGES: Record<string, string> = {
  ATTACHMENT_UNREADABLE: '첨부 파일을 읽을 수 없습니다. 암호가 걸려 있거나 손상된 파일인지 확인해 주세요.',
  ATTACHMENT_TOO_LARGE: '첨부 파일이 너무 큽니다. 파일당 50MB 이하로 올려 주세요.',
  TEMPLATE_NOT_FOUND: '선택한 양식을 찾을 수 없습니다. 다른 양식을 골라 주세요.',
  LLM_SERVER_ERROR: '생성 서버에 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.',
  TIMEOUT: '생성 시간이 너무 오래 걸려 중단되었습니다. 분량을 줄여 다시 시도해 보세요.',
  CANCELLED: '요청을 취소했습니다.',
}

export const getJobErrorMessage = (code: DocGenErrorCode | null | undefined, fallback?: string): string =>
  (code && ERROR_MESSAGES[code]) || fallback || '문서를 만들지 못했습니다. 다시 시도해 주세요.'

export const formatBytes = (size?: number | null): string => {
  if (!size || size <= 0) return '-'
  if (size < 1024) return `${size}B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`
  return `${(size / 1024 / 1024).toFixed(1)}MB`
}

export const formatClock = (iso?: string | null): string => {
  if (!iso) return ''
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  return new Date(t).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
}

export const formatDuration = (fromIso?: string | null, toIso?: string | null): string => {
  if (!fromIso || !toIso) return ''
  const sec = Math.max(0, Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 1000))
  if (Number.isNaN(sec)) return ''
  return sec < 60 ? `${sec}초` : `${Math.floor(sec / 60)}분 ${sec % 60}초`
}

export const formatEta = (seconds?: number | null): string => {
  if (seconds == null) return ''
  if (seconds < 60) return '1분 이내'
  return `약 ${Math.ceil(seconds / 60)}분`
}

export const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024
export const MAX_ATTACHMENTS = 5
export const ATTACHMENT_ACCEPT = '.pdf,.docx,.hwp,.hwpx,.xlsx,.txt,.md'
