// 문서 생성(docgen) 타입.
// TODO(백엔드 확인): 엔드포인트·필드·상태 문자열은 아직 가정값이다. 백엔드 명세가 나오면 맞춘다.

/** 서버가 내려주는 작업 상태 문자열. 해석은 utils/docgen.ts의 normalizeJobStatus 한 곳에서만 한다. */
export type DocGenServerStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | (string & {})

/** 생성 중 세부 단계 */
export type DocGenStage = 'ANALYZING' | 'DRAFTING' | 'FORMATTING' | (string & {})

export type DocGenOutputFormat = 'HWPX' | 'PDF'
export type DocGenLength = 'SHORT' | 'NORMAL' | 'LONG'

export interface DocGenTemplate {
  template_id: string
  name: string
  description: string
  /** 양식 썸네일 경로. 없으면 아이콘으로 대체 */
  thumbnail_url: string | null
  default_format: DocGenOutputFormat
}

export interface DocGenError {
  code: DocGenErrorCode
  detail: string
}

export type DocGenErrorCode =
  | 'TEMPLATE_NOT_FOUND'
  | 'LLM_SERVER_ERROR'
  | 'TIMEOUT'
  | 'CANCELLED'
  | (string & {})

/** 미리보기용 간이 본문. 실제 연결 시에는 PDF(변환본) URL로 대체될 예정 */
export interface DocGenPreviewSection {
  heading: string
  body: string
}

export interface DocGenResult {
  file_name: string
  size: number
  page_count: number
  sources_count: number
  preview: DocGenPreviewSection[]
}

export interface DocGenJob {
  job_id: string
  title: string
  prompt: string
  template_id: string
  template_name: string
  domain: string | null
  output_format: DocGenOutputFormat
  length: DocGenLength
  status: DocGenServerStatus
  stage: DocGenStage | null
  /** 0~100 */
  progress: number
  /** 대기 중일 때 내 앞의 작업 수 */
  queue_position: number | null
  eta_seconds: number | null
  error: DocGenError | null
  created_at: string
  started_at: string | null
  finished_at: string | null
  result: DocGenResult | null
}

export interface CreateDocGenJobFields {
  prompt: string
  template_id: string
  domain: string | null
  output_format: DocGenOutputFormat
  length: DocGenLength
}

interface ApiEnvelope<T> {
  success: boolean
  status_code: number
  data: T
  error: { code: string; detail: string } | null
}

export type GetDocGenTemplatesResponse = ApiEnvelope<{ templates: DocGenTemplate[] }>
export type GetDocGenJobsResponse = ApiEnvelope<{ jobs: DocGenJob[] }>
export type GetDocGenJobResponse = ApiEnvelope<DocGenJob>
export type CreateDocGenJobResponse = ApiEnvelope<DocGenJob>
export type DeleteDocGenJobResponse = ApiEnvelope<{ job_id: string }>
