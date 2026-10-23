// 문서 생성 목(mock) 서버. 진짜 API 응답과 같은 모양으로 돌려준다.
// TODO(백엔드 연결 시 삭제): 서비스가 실제 엔드포인트를 부르게 되면 이 파일은 지운다.
//
// - 작업은 sessionStorage에 저장해 새로고침 후에도 남는다(서버에 남아 있는 상황 흉내).
// - 상태는 생성 시각으로부터 흐른 시간으로 계산한다: 대기(2~5초) → 생성 중(8~16초) → 결과.
//   수정 요청은 더 짧다: 대기(1~2초) → 생성 중(4~8초).
// - 결과는 만들 때 무작위로 정한다: 완료 65% · 실패 20% · 서버 쪽 취소 15% (수정 요청은 완료 90%).
//   프롬프트(수정 요청은 요청 문장)에 '실패'가 들어가면 반드시 실패, '취소'가 들어가면 반드시 취소된다.
// - 결과 쪽·장 구조는 만들 때 미리 정해 두고, 완료되는 순간 내려준다.
// - 수정 요청은 문장의 낱말로 바꿀 내용을 고른다: 표·그래프(차트)·두 단(비교)·짧게(줄여)·추가(늘려)·삭제(빼).
//   그 밖의 문장은 대상 쪽에 '요청 반영' 줄을 더한다. 제목을 골랐고 따옴표 안에 글이 있으면 그 글로 바꾼다.
// - sessionStorage에 docgen_mock_offline=1 이면 서버 꺼짐(네트워크 오류)을 흉내 낸다.

import type {
  CreateDocGenJobFields,
  CreateDocGenJobResponse,
  CreateDocGenOutlineFields,
  CreateDocGenOutlineResponse,
  DeleteDocGenJobResponse,
  DocGenErrorCode,
  DocGenJob,
  DocGenKind,
  DocGenOutline,
  DocGenPage,
  DocGenPageLayout,
  DocGenTemplate,
  GetDocGenJobResponse,
  GetDocGenJobsResponse,
  GetDocGenTemplatesResponse,
  ReviseDocGenJobFields,
} from '../../types/docgen'

const STORE_KEY = 'docgen_mock_jobs'
const OFFLINE_KEY = 'docgen_mock_offline'

export const MOCK_TEMPLATES: DocGenTemplate[] = [
  { template_id: 'tpl-report', name: '보고서', description: '현황·분석·건의 순서의 일반 보고서', kind: 'doc', thumbnail_url: null, default_format: 'HWPX' },
  { template_id: 'tpl-official', name: '공문', description: '수신·참조·제목·본문 형식의 시행문', kind: 'doc', thumbnail_url: null, default_format: 'HWPX' },
  { template_id: 'tpl-minutes', name: '회의록', description: '일시·참석자·안건·결정사항 정리', kind: 'doc', thumbnail_url: null, default_format: 'HWPX' },
  { template_id: 'tpl-plan', name: '계획서', description: '목적·추진 일정·소요·기대효과', kind: 'doc', thumbnail_url: null, default_format: 'HWPX' },
  { template_id: 'tpl-result', name: '결과보고', description: '시행 결과와 개선 사항 요약', kind: 'doc', thumbnail_url: null, default_format: 'PDF' },
  { template_id: 'tpl-brief', name: '보고 브리핑', description: '배경·현황·문제점·개선 방안 순서의 지휘관 보고', kind: 'deck', thumbnail_url: null, default_format: 'PPTX' },
  { template_id: 'tpl-edu', name: '교육 자료', description: '목표·핵심 개념·절차·주의 사항으로 짠 교육용 발표', kind: 'deck', thumbnail_url: null, default_format: 'PPTX' },
  { template_id: 'tpl-deck-result', name: '결과 발표', description: '추진 결과와 성과 지표를 보여 주는 발표', kind: 'deck', thumbnail_url: null, default_format: 'PPTX' },
]

/* ───────── 개요·쪽 만들기 ───────── */

/** 양식별 개요 뼈대: [제목, 발표 자료에서 쓸 배치] */
const SKELETONS: Record<string, [string, DocGenPageLayout | null][]> = {
  'tpl-report': [['개요', null], ['현황', null], ['분석', null], ['건의', null]],
  'tpl-official': [['수신·참조', null], ['제목', null], ['본문', null], ['붙임', null]],
  'tpl-minutes': [['일시·장소', null], ['참석자', null], ['안건', null], ['결정 사항', null]],
  'tpl-plan': [['목적', null], ['추진 일정', 'table'], ['소요 예산', 'table'], ['기대 효과', null]],
  'tpl-result': [['시행 개요', null], ['결과', null], ['개선 사항', null]],
  'tpl-brief': [['추진 배경', 'bullets'], ['현황', 'chart'], ['문제점', 'bullets'], ['개선 방안', 'two-column'], ['향후 계획', 'table']],
  'tpl-edu': [['교육 목표', 'bullets'], ['핵심 개념', 'two-column'], ['절차 안내', 'table'], ['주의 사항', 'bullets'], ['확인 문제', 'bullets']],
  'tpl-deck-result': [['개요', 'bullets'], ['추진 결과', 'table'], ['성과 지표', 'chart'], ['개선 사항', 'two-column'], ['건의', 'bullets']],
}

const POINTS: Record<string, string[]> = {
  '추진 배경': ['{t} 관련 요구가 꾸준히 늘어남', '기존 방식은 처리 시간이 길고 담당자 의존도가 높음', '상급 부대 지침에 따라 개선 필요'],
  '현황': ['최근 분기 처리율 꾸준히 상승', '부대별 편차가 큼', '반복 업무 비중이 절반 이상'],
  '문제점': ['절차가 부서마다 달라 혼선 발생', '확인 단계가 중복되어 시간이 걸림', '자료가 흩어져 있어 찾기 어려움'],
  '개선 방안': ['절차를 하나로 통일', '확인 단계를 한 번으로 줄임', '자료를 한곳에 모아 검색 가능하게 함', '담당자 교육을 분기마다 실시'],
  '향후 계획': ['1단계 시범 운영', '2단계 결과 분석과 보완', '3단계 전 부대 확대'],
  '추진 일정': ['준비 및 계획 수립', '시범 운영', '결과 분석', '전면 시행'],
  '소요 예산': ['장비 구입', '교육 운영', '예비비'],
  '성과 지표': ['처리 시간', '오류율', '만족도', '재요청률'],
  '추진 결과': ['시범 부대 운영 완료', '처리 절차 표준안 마련', '담당자 교육 실시'],
  '교육 목표': ['{t}의 기본 개념 이해', '절차를 스스로 수행', '자주 하는 실수 예방'],
  '핵심 개념': ['용어와 기준', '역할과 책임', '자주 쓰는 양식', '확인 방법'],
  '절차 안내': ['요청 접수', '검토 및 승인', '시행', '결과 보고'],
  '주의 사항': ['보안 규정 준수', '기한 엄수', '변경 사항은 즉시 공유'],
  '확인 문제': ['절차의 첫 단계는 무엇인가?', '승인권자는 누구인가?', '결과 보고 기한은 언제인가?'],
}

const pointsFor = (title: string, topic: string) =>
  (POINTS[title] ?? [`${title} 주요 내용 정리`, `${topic} 관련 세부 사항`, '추가 확인이 필요한 사항']).map((p) => p.replace('{t}', topic))

let seq = 0
const pid = () => `pg-${Date.now().toString(36)}-${(seq++).toString(36)}`

const rand = (min: number, max: number) => min + Math.random() * (max - min)

const short = (s: string, n = 10) => (s.length > n ? `${s.slice(0, n)}…` : s)

const blankPage = (layout: DocGenPageLayout, title: string): DocGenPage => ({
  page_id: pid(), layout, title, subtitle: null, bullets: [], columns: [], table: null, chart: null, body: null,
})

/** 글머리표를 배치에 맞는 모양으로 바꾼다 */
const shape = (page: DocGenPage, layout: DocGenPageLayout, points: string[]): DocGenPage => {
  const next: DocGenPage = { ...page, layout, bullets: [], columns: [], table: null, chart: null }
  if (layout === 'bullets' || layout === 'text') next.bullets = points
  if (layout === 'text') next.body = `${points.join('. ')}. 세부 내용은 관련 규정과 현황 자료를 바탕으로 정리했습니다.`
  if (layout === 'two-column') {
    const half = Math.ceil(points.length / 2)
    const [a, b] = page.title.includes('개선') ? ['현재', '개선'] : ['주요 내용', '세부 사항']
    next.columns = [{ heading: a, bullets: points.slice(0, half) }, { heading: b, bullets: points.slice(half) }]
  }
  if (layout === 'table') {
    const schedule = /일정|계획/.test(page.title)
    next.table = schedule
      ? { columns: ['단계', '내용', '기간'], rows: points.map((p, i) => [`${i + 1}단계`, p, `${i + 1}~${i + 2}월`]) }
      : { columns: ['구분', '내용', '비고'], rows: points.map((p, i) => [`${i + 1}`, p, i === 0 ? '완료' : '진행 중']) }
  }
  if (layout === 'chart') next.chart = { unit: '%', data: points.map((p) => ({ label: short(p, 8), value: Math.round(rand(35, 95)) })) }
  return next
}

/** 쪽에 들어 있는 글을 배치와 상관없이 글머리표 목록으로 꺼낸다 (배치를 바꿀 때 내용을 잃지 않도록) */
const pointsOf = (page: DocGenPage): string[] => {
  if (page.table) return page.table.rows.map((r) => r[1] ?? r[0])
  if (page.chart) return page.chart.data.map((d) => d.label)
  if (page.columns.length) return page.columns.flatMap((c) => c.bullets)
  return page.bullets
}

const buildPages = (kind: DocGenKind, outline: DocGenOutline, templateName: string): DocGenPage[] => {
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  const body = outline.items.map((item) => shape(blankPage('bullets', item.title), kind === 'deck' ? item.layout ?? 'bullets' : item.layout ?? 'text', item.points))
  if (kind === 'doc') return body
  const cover = { ...blankPage('cover', outline.title), subtitle: `${templateName} · ${today}` }
  return [cover, ...body]
}

const defaultOutline = (templateId: string, prompt: string): DocGenOutline => {
  const title = toTitle(prompt)
  const topic = short(title, 14)
  const skeleton = SKELETONS[templateId] ?? SKELETONS['tpl-report']
  return { title, items: skeleton.map(([t, layout]) => ({ title: t, points: pointsFor(t, topic), layout })) }
}

/* ───────── 수정 요청 반영 ───────── */

const revisePages = (pages: DocGenPage[], fields: ReviseDocGenJobFields, kind: DocGenKind): DocGenPage[] => {
  const text = fields.instruction
  const copy = pages.map((p) => ({ ...p }))
  const at = fields.page_id ? copy.findIndex((p) => p.page_id === fields.page_id) : -1
  const targets = at >= 0 ? [at] : copy.map((_, i) => i).filter((i) => copy[i].layout !== 'cover')
  const relayout = (layout: DocGenPageLayout) => targets.forEach((i) => { copy[i] = shape(copy[i], layout, pointsOf(copy[i])) })

  if (/삭제|빼/.test(text) && at >= 0) return copy.filter((_, i) => i !== at)
  if (/표/.test(text)) { relayout('table'); return copy }
  if (/그래프|차트/.test(text)) { relayout('chart'); return copy }
  if (/두 단|2단|비교/.test(text)) { relayout('two-column'); return copy }
  if (/짧|줄여|간단/.test(text)) {
    // 대상 쪽은 글머리표를 줄이고, 전체 요청이면 마지막 쪽을 뺀다
    if (at < 0 && copy.length > 3) return copy.slice(0, -1)
    targets.forEach((i) => { copy[i] = shape(copy[i], copy[i].layout === 'cover' ? 'bullets' : copy[i].layout, pointsOf(copy[i]).slice(0, 2)) })
    return copy
  }
  if (/추가|늘려|더 넣/.test(text)) {
    if (at < 0) return [...copy, shape(blankPage('bullets', '추가 검토 사항'), kind === 'deck' ? 'bullets' : 'text', ['요청에 따라 더한 항목', '관련 자료 재확인', '후속 조치 제안'])]
    targets.forEach((i) => { copy[i] = shape(copy[i], copy[i].layout, [...pointsOf(copy[i]), '요청에 따라 더한 항목']) })
    return copy
  }
  const quoted = text.match(/["“'‘]([^"”'’]+)["”'’]/)?.[1]
  targets.forEach((i) => {
    if (fields.element === 'title' && quoted) copy[i] = { ...copy[i], title: quoted }
    else if (copy[i].layout === 'cover') copy[i] = { ...copy[i], subtitle: `${copy[i].subtitle ?? ''} · ${short(text, 20)}` }
    else copy[i] = shape(copy[i], copy[i].layout, [...pointsOf(copy[i]), `요청 반영: ${short(text, 24)}`])
  })
  return copy
}

/* ───────── 작업 저장소 ───────── */

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
  /** 완료되면 내려줄 쪽·장 */
  pages: DocGenPage[]
}

/** 결과·걸리는 시간을 무작위로 정한다 */
const roll = (text: string, revision = false): Omit<StoredJob, 'job' | 'base' | 'cancelled' | 'pages'> => {
  const r = Math.random()
  const [ok, fail] = revision ? [0.9, 0.97] : [0.65, 0.85]
  const outcome: Outcome = text.includes('실패') ? 'fail' : text.includes('취소') ? 'cancel' : r < ok ? 'complete' : r < fail ? 'fail' : 'cancel'
  return {
    queueMs: Math.round(revision ? rand(1000, 2000) : rand(2000, 5000)),
    runMs: Math.round(revision ? rand(4000, 8000) : rand(8000, 16000)),
    outcome,
    stopAt: rand(0.25, 0.8),
    errorCode: outcome === 'cancel' ? 'CANCELLED' : Math.random() < 0.7 ? 'LLM_SERVER_ERROR' : 'TIMEOUT',
  }
}

const read = (): StoredJob[] => {
  try {
    const raw = sessionStorage.getItem(STORE_KEY)
    // 쪽 구조가 생기기 전에 저장된 작업은 모양이 달라 버린다
    return raw ? (JSON.parse(raw) as StoredJob[]).filter((i) => Array.isArray(i.pages) && i.job?.root_job_id) : []
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

const EXT: Record<string, string> = { HWPX: 'hwpx', PDF: 'pdf', PPTX: 'pptx' }

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
  const pages = item.pages
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
      file_name: `${job.title}${job.version > 1 ? ` (v${job.version})` : ''}.${EXT[job.output_format] ?? 'pdf'}`,
      size: Math.round(rand(90_000, 400_000) * (job.kind === 'deck' ? 4 : 1)),
      page_count: pages.length,
      sources_count: 4,
      preview: pages.map((p) => ({ heading: p.title, body: p.body ?? pointsOf(p).join('\n') })),
      pages,
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

const ok = async <T>(data: T, ms?: number) => {
  await delay(ms)
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

function toTitle(prompt: string): string {
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

  /** 개요는 짧게 생각하는 척만 하고 양식 뼈대로 돌려준다 */
  createOutline: (fields: CreateDocGenOutlineFields): Promise<{ data: CreateDocGenOutlineResponse }> =>
    ok(defaultOutline(fields.template_id, fields.prompt), Math.round(rand(900, 1600))),

  createJob: async (fields: CreateDocGenJobFields): Promise<{ data: CreateDocGenJobResponse }> => {
    const tpl = MOCK_TEMPLATES.find((t) => t.template_id === fields.template_id)
    const kind = tpl?.kind ?? 'doc'
    const outline = fields.outline ?? defaultOutline(fields.template_id, fields.prompt)
    const now = Date.now()
    const jobId = `job-${now.toString(36)}`
    const job: DocGenJob = {
      job_id: jobId,
      root_job_id: jobId,
      parent_job_id: null,
      version: 1,
      title: outline.title || toTitle(fields.prompt),
      prompt: fields.prompt,
      instruction: null,
      target_page_id: null,
      target_element: null,
      kind,
      outline: outline.items,
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
    const item: StoredJob = { job, base: now, cancelled: false, pages: buildPages(kind, outline, job.template_name), ...roll(fields.prompt) }
    write([...read(), item])
    return ok(advance(item, now, 0))
  },

  reviseJob: async (jobId: string, fields: ReviseDocGenJobFields): Promise<{ data: CreateDocGenJobResponse }> => {
    const items = read()
    const now = Date.now()
    const parent = items.find((i) => i.job.job_id === jobId)
    const parentJob = parent && advance(parent, now, 0)
    if (!parent || !parentJob?.result) return notFound()
    const versions = items.filter((i) => i.job.root_job_id === parentJob.root_job_id)
    const newId = `job-${now.toString(36)}`
    const job: DocGenJob = {
      ...parentJob,
      job_id: newId,
      parent_job_id: parentJob.job_id,
      version: Math.max(...versions.map((v) => v.job.version)) + 1,
      instruction: fields.instruction,
      target_page_id: fields.page_id,
      target_element: fields.element,
      status: 'QUEUED',
      progress: 0,
      queue_position: 0,
      eta_seconds: null,
      error: null,
      created_at: iso(now),
      started_at: null,
      finished_at: null,
      result: null,
    }
    const item: StoredJob = { job, base: now, cancelled: false, pages: revisePages(parentJob.result.pages, fields, job.kind), ...roll(fields.instruction, true) }
    write([...items, item])
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
    Object.assign(item, roll(item.job.instruction ?? item.job.prompt, item.job.version > 1), { base: now, cancelled: false })
    item.job = { ...item.job, error: null, result: null, started_at: null, finished_at: null }
    write(items)
    return ok(advance(item, now, 0))
  },

  /** 처음 만든 작업을 지우면 그 문서의 모든 버전이 함께 지워진다 */
  deleteJob: async (jobId: string): Promise<{ data: DeleteDocGenJobResponse }> => {
    write(read().filter((i) => i.job.job_id !== jobId && i.job.root_job_id !== jobId))
    return ok({ job_id: jobId })
  },
}
