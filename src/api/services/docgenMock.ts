// 문서 생성 목(mock) 서버. 진짜 API 응답과 같은 모양으로 돌려준다.
// TODO(백엔드 연결 시 삭제): 서비스가 실제 엔드포인트를 부르게 되면 이 파일은 지운다.
//
// - 작업은 sessionStorage에 저장해 새로고침 후에도 남는다(서버에 남아 있는 상황 흉내).
// - 상태는 생성 시각으로부터 흐른 시간으로 계산한다: 대기 4초 → 생성 중 12초 → 완료.
// - 프롬프트에 '실패'가 들어가면 생성 중 단계에서 실패한다.
// - sessionStorage에 docgen_mock_offline=1 이면 서버 꺼짐(네트워크 오류)을 흉내 낸다.

import type {
  CreateDocGenJobFields,
  CreateDocGenJobResponse,
  DeleteDocGenJobResponse,
  DocGenJob,
  DocGenTemplate,
  GetDocGenJobResponse,
  GetDocGenJobsResponse,
  GetDocGenTemplatesResponse,
} from '../../types/docgen'

const STORE_KEY = 'docgen_mock_jobs'
const OFFLINE_KEY = 'docgen_mock_offline'
const QUEUE_MS = 4000
const RUN_MS = 12000

export const MOCK_TEMPLATES: DocGenTemplate[] = [
  { template_id: 'tpl-report', name: '보고서', description: '현황·분석·건의 순서의 일반 보고서', thumbnail_url: null, default_format: 'HWPX' },
  { template_id: 'tpl-official', name: '공문', description: '수신·참조·제목·본문 형식의 시행문', thumbnail_url: null, default_format: 'HWPX' },
  { template_id: 'tpl-minutes', name: '회의록', description: '일시·참석자·안건·결정사항 정리', thumbnail_url: null, default_format: 'DOCX' },
  { template_id: 'tpl-plan', name: '계획서', description: '목적·추진 일정·소요·기대효과', thumbnail_url: null, default_format: 'HWPX' },
  { template_id: 'tpl-result', name: '결과보고', description: '시행 결과와 개선 사항 요약', thumbnail_url: null, default_format: 'PDF' },
]

interface StoredJob {
  job: DocGenJob
  /** 상태 계산 기준 시각(ms). 재시도하면 다시 설정 */
  base: number
  willFail: boolean
  cancelled: boolean
}

const read = (): StoredJob[] => {
  try {
    const raw = sessionStorage.getItem(STORE_KEY)
    return raw ? (JSON.parse(raw) as StoredJob[]) : []
  } catch {
    return []
  }
}

const write = (items: StoredJob[]) => {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(items))
  } catch {
    // 저장 공간이 없으면 메모리에서만 유지되는 것과 같다
  }
}

const iso = (ms: number) => new Date(ms).toISOString()

/** 흐른 시간으로 현재 상태를 계산해 job을 갱신한다 */
const advance = (item: StoredJob, now: number, queueAhead: number): DocGenJob => {
  const { job, base } = item
  if (item.cancelled) return job
  const elapsed = now - base
  if (elapsed < QUEUE_MS) {
    return {
      ...job,
      status: 'QUEUED',
      stage: null,
      progress: 0,
      queue_position: queueAhead,
      eta_seconds: Math.ceil((QUEUE_MS - elapsed + RUN_MS) / 1000),
    }
  }
  const run = elapsed - QUEUE_MS
  const startedAt = iso(base + QUEUE_MS)
  if (item.willFail && run >= RUN_MS * 0.45) {
    return {
      ...job,
      status: 'FAILED',
      stage: 'DRAFTING',
      progress: 45,
      queue_position: null,
      eta_seconds: null,
      started_at: startedAt,
      finished_at: iso(base + QUEUE_MS + RUN_MS * 0.45),
      error: { code: 'ATTACHMENT_UNREADABLE', detail: '첨부 파일 1개를 읽지 못했습니다.' },
      result: null,
    }
  }
  if (run < RUN_MS) {
    const progress = Math.min(99, Math.round((run / RUN_MS) * 100))
    const stage = progress < 30 ? 'ANALYZING' : progress < 80 ? 'DRAFTING' : 'FORMATTING'
    return {
      ...job,
      status: 'RUNNING',
      stage,
      progress,
      queue_position: null,
      eta_seconds: Math.ceil((RUN_MS - run) / 1000),
      started_at: startedAt,
    }
  }
  return {
    ...job,
    status: 'COMPLETED',
    stage: 'FORMATTING',
    progress: 100,
    queue_position: null,
    eta_seconds: null,
    started_at: startedAt,
    finished_at: iso(base + QUEUE_MS + RUN_MS),
    error: null,
    result: {
      file_name: `${job.title}.${job.output_format.toLowerCase()}`,
      size: 184_320,
      page_count: 3,
      sources_count: job.attachments.length + 2,
      preview: [
        { heading: '1. 개요', body: `${job.prompt}\n요청 내용을 바탕으로 ${job.template_name} 양식에 맞춰 작성한 예시 본문입니다.` },
        { heading: '2. 현황', body: '첨부 자료와 관련 규정에서 확인한 내용을 항목별로 정리합니다. (목 데이터)' },
        { heading: '3. 건의', body: '검토가 필요한 사항과 후속 조치를 제안합니다. (목 데이터)' },
      ],
    },
  }
}

const snapshot = (): DocGenJob[] => {
  const now = Date.now()
  const items = read()
  // 대기 순번: 나보다 먼저 들어와 아직 대기 중인 작업 수
  return items
    .map((item, i) => {
      const ahead = items
        .slice(0, i)
        .filter((o) => !o.cancelled && now - o.base < QUEUE_MS).length
      return advance(item, now, ahead)
    })
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
}

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms))

const ok = async <T>(data: T) => {
  await delay()
  if (sessionStorage.getItem(OFFLINE_KEY) === '1') {
    // axios의 네트워크 오류처럼 response가 없는 오류
    throw Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK', response: undefined })
  }
  return { data: { success: true, status_code: 200, data, error: null } }
}

const notFound = async () => {
  await delay()
  throw Object.assign(new Error('Not Found'), {
    response: { status: 404, data: { error: { code: 'JOB_NOT_FOUND', detail: '작업을 찾을 수 없습니다.' } } },
  })
}

const toTitle = (prompt: string): string => {
  const line = prompt.split('\n').map((l) => l.trim()).find(Boolean) ?? '새 문서'
  return line.length > 40 ? `${line.slice(0, 40)}…` : line
}

export const docgenMock = {
  getTemplates: (): Promise<{ data: GetDocGenTemplatesResponse }> => ok({ templates: MOCK_TEMPLATES }),

  getJobs: (): Promise<{ data: GetDocGenJobsResponse }> => ok({ jobs: snapshot() }),

  getJob: async (jobId: string): Promise<{ data: GetDocGenJobResponse }> => {
    const job = snapshot().find((j) => j.job_id === jobId)
    if (!job) return notFound()
    return ok(job)
  },

  createJob: async (fields: CreateDocGenJobFields, files: File[]): Promise<{ data: CreateDocGenJobResponse }> => {
    const tpl = MOCK_TEMPLATES.find((t) => t.template_id === fields.template_id)
    const now = Date.now()
    const job: DocGenJob = {
      job_id: `job-${now.toString(36)}`,
      title: toTitle(fields.prompt),
      prompt: fields.prompt,
      template_id: fields.template_id,
      template_name: tpl?.name ?? '양식',
      domain: fields.domain,
      output_format: fields.output_format,
      length: fields.length,
      attachments: files.map((f) => ({ name: f.name, size: f.size })),
      status: 'QUEUED',
      stage: null,
      progress: 0,
      queue_position: 0,
      eta_seconds: null,
      error: null,
      created_at: iso(now),
      started_at: null,
      finished_at: null,
      result: null,
    }
    write([...read(), { job, base: now, willFail: fields.prompt.includes('실패'), cancelled: false }])
    return ok(advance({ job, base: now, willFail: false, cancelled: false }, now, 0))
  },

  cancelJob: async (jobId: string): Promise<{ data: GetDocGenJobResponse }> => {
    const items = read()
    const item = items.find((i) => i.job.job_id === jobId)
    if (!item) return notFound()
    const current = advance(item, Date.now(), 0)
    item.cancelled = true
    item.job = {
      ...current,
      status: 'CANCELLED',
      queue_position: null,
      eta_seconds: null,
      finished_at: iso(Date.now()),
      error: { code: 'CANCELLED', detail: '사용자가 요청을 취소했습니다.' },
    }
    write(items)
    return ok(item.job)
  },

  retryJob: async (jobId: string): Promise<{ data: GetDocGenJobResponse }> => {
    const items = read()
    const item = items.find((i) => i.job.job_id === jobId)
    if (!item) return notFound()
    const now = Date.now()
    item.base = now
    item.cancelled = false
    item.willFail = false
    item.job = { ...item.job, error: null, result: null, started_at: null, finished_at: null }
    write(items)
    return ok(advance(item, now, 0))
  },

  deleteJob: async (jobId: string): Promise<{ data: DeleteDocGenJobResponse }> => {
    write(read().filter((i) => i.job.job_id !== jobId))
    return ok({ job_id: jobId })
  },
}
