// 문서 생성 목(mock) 서버. 진짜 API 응답과 같은 모양으로 돌려준다.
// TODO(백엔드 연결 시 삭제): 서비스가 실제 엔드포인트를 부르게 되면 이 파일은 지운다.
//
// - 작업은 sessionStorage에 저장해 새로고침 후에도 남는다(서버에 남아 있는 상황 흉내).
// - 상태는 생성 시각으로부터 흐른 시간으로 계산한다: 대기(2~5초) → 생성 중(8~16초) → 결과.
// - 결과는 만들 때 무작위로 정한다: 완료 65% · 실패 20% · 서버 쪽 취소 15%.
//   프롬프트에 '실패'가 들어가면 반드시 실패, '취소'가 들어가면 반드시 취소된다.
// - sessionStorage에 docgen_mock_offline=1 이면 서버 꺼짐(네트워크 오류)을 흉내 낸다.

import type {
  CreateDocGenJobFields,
  CreateDocGenJobResponse,
  DeleteDocGenJobResponse,
  DocGenErrorCode,
  DocGenJob,
  DocGenTemplate,
  GetDocGenJobResponse,
  GetDocGenJobsResponse,
  GetDocGenTemplatesResponse,
} from '../../types/docgen'

const STORE_KEY = 'docgen_mock_jobs'
const OFFLINE_KEY = 'docgen_mock_offline'

export const MOCK_TEMPLATES: DocGenTemplate[] = [
  { template_id: 'tpl-report', name: '보고서', description: '현황·분석·건의 순서의 일반 보고서', thumbnail_url: null, default_format: 'HWPX' },
  { template_id: 'tpl-official', name: '공문', description: '수신·참조·제목·본문 형식의 시행문', thumbnail_url: null, default_format: 'HWPX' },
  { template_id: 'tpl-minutes', name: '회의록', description: '일시·참석자·안건·결정사항 정리', thumbnail_url: null, default_format: 'HWPX' },
  { template_id: 'tpl-plan', name: '계획서', description: '목적·추진 일정·소요·기대효과', thumbnail_url: null, default_format: 'HWPX' },
  { template_id: 'tpl-result', name: '결과보고', description: '시행 결과와 개선 사항 요약', thumbnail_url: null, default_format: 'PDF' },
]

type Outcome = 'complete' | 'fail' | 'cancel'

interface StoredJob {
  job: DocGenJob
  /** 상태 계산 기준 시각(ms). 재시도하면 다시 설정 */
  base: number
  queueMs: number
  runMs: number
  outcome: Outcome
  /** 실패·취소가 일어나는 진행률(0~1) */
  stopAt: number
  errorCode: DocGenErrorCode
  /** 사용자가 직접 취소함 */
  cancelled: boolean
}

const rand = (min: number, max: number) => min + Math.random() * (max - min)

/** 결과·걸리는 시간을 무작위로 정한다 */
const roll = (prompt: string): Omit<StoredJob, 'job' | 'base' | 'cancelled'> => {
  const r = Math.random()
  const outcome: Outcome = prompt.includes('실패') ? 'fail' : prompt.includes('취소') ? 'cancel' : r < 0.65 ? 'complete' : r < 0.85 ? 'fail' : 'cancel'
  return {
    queueMs: Math.round(rand(2000, 5000)),
    runMs: Math.round(rand(8000, 16000)),
    outcome,
    stopAt: rand(0.25, 0.8),
    errorCode: outcome === 'cancel' ? 'CANCELLED' : Math.random() < 0.7 ? 'LLM_SERVER_ERROR' : 'TIMEOUT',
  }
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
  const { job, base, queueMs, runMs } = item
  if (item.cancelled) return job
  const elapsed = now - base
  if (elapsed < queueMs) {
    return {
      ...job,
      status: 'QUEUED',
      stage: null,
      progress: 0,
      queue_position: queueAhead,
      eta_seconds: Math.ceil((queueMs - elapsed + runMs) / 1000),
    }
  }
  const run = elapsed - queueMs
  const startedAt = iso(base + queueMs)
  if (item.outcome !== 'complete' && run >= runMs * item.stopAt) {
    return {
      ...job,
      status: item.outcome === 'cancel' ? 'CANCELLED' : 'FAILED',
      stage: null,
      progress: Math.round(item.stopAt * 100),
      queue_position: null,
      eta_seconds: null,
      started_at: startedAt,
      finished_at: iso(base + queueMs + runMs * item.stopAt),
      error: { code: item.errorCode, detail: item.outcome === 'cancel' ? '서버에서 요청이 취소되었습니다.' : '' },
      result: null,
    }
  }
  if (run < runMs) {
    return {
      ...job,
      status: 'RUNNING',
      stage: null,
      progress: Math.min(99, Math.round((run / runMs) * 100)),
      queue_position: null,
      eta_seconds: Math.ceil((runMs - run) / 1000),
      started_at: startedAt,
    }
  }
  return {
    ...job,
    status: 'COMPLETED',
    stage: null,
    progress: 100,
    queue_position: null,
    eta_seconds: null,
    started_at: startedAt,
    finished_at: iso(base + queueMs + runMs),
    error: null,
    result: {
      file_name: `${job.title}.${job.output_format.toLowerCase()}`,
      size: Math.round(rand(90_000, 400_000)),
      page_count: Math.ceil(rand(1, 6)),
      sources_count: 4,
      preview: [
        { heading: '1. 개요', body: `${job.prompt}\n요청 내용을 바탕으로 ${job.template_name} 양식에 맞춰 작성한 예시 본문입니다.` },
        { heading: '2. 현황', body: '관련 규정에서 확인한 내용을 항목별로 정리합니다. (목 데이터)' },
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
        .filter((o) => !o.cancelled && now - o.base < o.queueMs).length
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

/** 저장된 작업을 모두 지운다 (시안을 처음 상태로 열 때) */
export const resetDocGenMock = () => write([])

export const docgenMock = {
  getTemplates: (): Promise<{ data: GetDocGenTemplatesResponse }> => ok({ templates: MOCK_TEMPLATES }),

  getJobs: (): Promise<{ data: GetDocGenJobsResponse }> => ok({ jobs: snapshot() }),

  getJob: async (jobId: string): Promise<{ data: GetDocGenJobResponse }> => {
    const job = snapshot().find((j) => j.job_id === jobId)
    if (!job) return notFound()
    return ok(job)
  },

  createJob: async (fields: CreateDocGenJobFields): Promise<{ data: CreateDocGenJobResponse }> => {
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
    const item: StoredJob = { job, base: now, cancelled: false, ...roll(fields.prompt) }
    write([...read(), item])
    return ok(advance(item, now, 0))
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
    Object.assign(item, roll(item.job.prompt), { base: now, cancelled: false })
    item.job = { ...item.job, error: null, result: null, started_at: null, finished_at: null }
    write(items)
    return ok(advance(item, now, 0))
  },

  deleteJob: async (jobId: string): Promise<{ data: DeleteDocGenJobResponse }> => {
    write(read().filter((i) => i.job.job_id !== jobId))
    return ok({ job_id: jobId })
  },
}
