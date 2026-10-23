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

export type DocGenOutputFormat = 'HWPX' | 'PDF' | 'PPTX'
export type DocGenLength = 'SHORT' | 'NORMAL' | 'LONG'

/** 만드는 것의 종류. 문서(쪽 단위)와 발표 자료(장 단위)는 같은 작업 흐름을 쓰고 그리는 모양만 다르다 */
export type DocGenKind = 'doc' | 'deck'

export interface DocGenTemplate {
  template_id: string
  name: string
  description: string
  kind: DocGenKind
  /** 양식 썸네일 경로. 없으면 아이콘으로 대체 */
  thumbnail_url: string | null
  default_format: DocGenOutputFormat
}

/* ───────── 구조화된 결과 (스튜디오) ─────────
 * 결과를 파일만이 아니라 쪽·장 단위 구조로 받는다. 썸네일·선택·부분 수정이 모두 이 구조를 쓴다.
 * TODO(백엔드 확인): 필드 이름과 배치 종류는 프론트 가정값이다.
 */

/** 한 쪽·장의 배치 */
export type DocGenPageLayout =
  | 'cover' // 표지(제목·부제)
  | 'bullets' // 제목 + 글머리표
  | 'two-column' // 제목 + 두 단 비교
  | 'table' // 제목 + 표
  | 'chart' // 제목 + 막대그래프
  | 'text' // 제목 + 문단 (문서 쪽)

/** 한 쪽 안에서 골라 고칠 수 있는 부분 */
export type DocGenPageElement = 'title' | 'subtitle' | 'bullets' | 'columns' | 'table' | 'chart' | 'body'

export interface DocGenTable {
  columns: string[]
  rows: string[][]
}

export interface DocGenChart {
  /** 값의 단위 (예: %, 건) */
  unit: string
  data: { label: string; value: number }[]
}

export interface DocGenPage {
  page_id: string
  layout: DocGenPageLayout
  title: string
  subtitle: string | null
  bullets: string[]
  columns: { heading: string; bullets: string[] }[]
  table: DocGenTable | null
  chart: DocGenChart | null
  body: string | null
}

/** 만들기 전에 확인하는 개요의 한 항목 = 만들어질 한 쪽·장 */
export interface DocGenOutlineItem {
  title: string
  points: string[]
  /** 발표 자료에서 이 장에 쓸 배치 제안. 없으면 서버가 정한다 */
  layout: DocGenPageLayout | null
}

export interface DocGenOutline {
  title: string
  items: DocGenOutlineItem[]
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
  /** 쪽·장 구조. 스튜디오가 그리고 고치는 단위 */
  pages: DocGenPage[]
}

/**
 * 생성 작업. 수정 요청도 새 작업이 되며, 같은 문서의 작업들은 root_job_id로 묶이고 version 순으로 쌓인다.
 * 처음 만든 작업은 root_job_id = job_id, version = 1, parent_job_id = null.
 */
export interface DocGenJob {
  job_id: string
  root_job_id: string
  parent_job_id: string | null
  version: number
  title: string
  prompt: string
  /** 수정 요청 문장 (처음 만든 작업이면 null) */
  instruction: string | null
  /** 수정 대상 쪽 (전체 수정이거나 처음 만든 작업이면 null) */
  target_page_id: string | null
  target_element: DocGenPageElement | null
  kind: DocGenKind
  /** 만들 때 확정한 개요. 진행 중에 몇 쪽째인지 보여 줄 때 쓴다 */
  outline: DocGenOutlineItem[] | null
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
  /** 사용자가 확인·편집한 개요. 없으면 서버가 알아서 짠다 */
  outline?: DocGenOutline | null
}

export interface CreateDocGenOutlineFields {
  prompt: string
  template_id: string
  domain: string | null
  output_format: DocGenOutputFormat
}

/** 이미 만든 작업을 기준으로 고친다. page_id가 없으면 전체를 고친다 */
export interface ReviseDocGenJobFields {
  instruction: string
  page_id: string | null
  element: DocGenPageElement | null
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
export type CreateDocGenOutlineResponse = ApiEnvelope<DocGenOutline>
export type DeleteDocGenJobResponse = ApiEnvelope<{ job_id: string }>
