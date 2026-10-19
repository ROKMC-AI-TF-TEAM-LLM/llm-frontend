// TEMP(시안 비교용): 6단계에서 drafts 폴더째 삭제
import type { DocGenJob } from '../../../types/docgen'
import { MOCK_TEMPLATES } from '../../../api/services/docgenMock'
import type { PageState } from '../../../utils/docgen'

export const TEMPLATES = MOCK_TEMPLATES

const base: DocGenJob = {
  job_id: 'job-a',
  title: '3분기 정보보안 점검 결과 보고',
  prompt: '첨부한 점검표와 조치 내역으로 3분기 정보보안 점검 결과 보고서 초안을 만들어줘. 미조치 항목은 따로 표로 정리해줘.',
  template_id: 'tpl-report',
  template_name: '보고서',
  domain: 'TECH',
  output_format: 'HWPX',
  length: 'NORMAL',
  attachments: [
    { name: '3분기_보안점검표.xlsx', size: 128_400 },
    { name: '조치내역_취합.pdf', size: 2_412_000 },
  ],
  status: 'QUEUED',
  stage: null,
  progress: 0,
  queue_position: 2,
  eta_seconds: 95,
  error: null,
  created_at: '2026-10-19T07:40:00.000Z',
  started_at: null,
  finished_at: null,
  result: null,
}

const queued: DocGenJob = base
const running: DocGenJob = {
  ...base,
  status: 'RUNNING',
  stage: 'DRAFTING',
  progress: 58,
  queue_position: null,
  eta_seconds: 40,
  started_at: '2026-10-19T07:41:30.000Z',
}
const completed: DocGenJob = {
  ...running,
  status: 'COMPLETED',
  stage: 'FORMATTING',
  progress: 100,
  eta_seconds: null,
  finished_at: '2026-10-19T07:42:18.000Z',
  result: {
    file_name: '3분기 정보보안 점검 결과 보고.hwpx',
    size: 184_320,
    page_count: 3,
    sources_count: 4,
    preview: [
      { heading: '1. 개요', body: '2026년 3분기 정보보안 정기 점검 결과를 보고합니다. 점검 대상 24개 항목 중 21개 항목이 적합으로 확인되었습니다.' },
      { heading: '2. 점검 결과', body: '비밀번호 변경 주기, 보조기억매체 통제, 망분리 운영 실태를 중심으로 점검했습니다. 세부 결과는 붙임 표와 같습니다.' },
      { heading: '3. 미조치 사항 및 건의', body: '미조치 3건은 10월 말까지 조치하고 결과를 재보고하겠습니다.' },
    ],
  },
}
const failed: DocGenJob = {
  ...running,
  status: 'FAILED',
  progress: 45,
  eta_seconds: null,
  finished_at: '2026-10-19T07:41:52.000Z',
  error: { code: 'ATTACHMENT_UNREADABLE', detail: "'조치내역_취합.pdf'를 읽지 못했습니다." },
}

const olderDone: DocGenJob = {
  ...completed,
  job_id: 'job-b',
  title: '10월 정례 회의 결과 정리',
  template_id: 'tpl-minutes',
  template_name: '회의록',
  domain: 'GENERAL',
  output_format: 'DOCX',
  attachments: [],
  created_at: '2026-10-19T05:12:00.000Z',
  started_at: '2026-10-19T05:12:04.000Z',
  finished_at: '2026-10-19T05:12:41.000Z',
}
const olderFailed: DocGenJob = {
  ...failed,
  job_id: 'job-c',
  title: '동계 훈련 계획 공문',
  template_id: 'tpl-official',
  template_name: '공문',
  domain: 'HR',
  attachments: [],
  created_at: '2026-10-18T23:30:00.000Z',
  error: { code: 'LLM_SERVER_ERROR', detail: '' },
}

export interface Scenario {
  /** 오른쪽 미리보기에 띄운 작업 */
  selected: DocGenJob | null
  jobs: DocGenJob[]
  prompt: string
  templateId: string | null
  attachments: { name: string; size: number; broken?: boolean }[]
}

const filledInput = {
  prompt: base.prompt,
  templateId: 'tpl-report',
  attachments: base.attachments,
}

export const SCENARIOS: Record<PageState, Scenario> = {
  idle: { selected: null, jobs: [], prompt: '', templateId: null, attachments: [] },
  queued: { ...filledInput, selected: queued, jobs: [queued, olderDone] },
  running: { ...filledInput, selected: running, jobs: [running, olderDone] },
  completed: { ...filledInput, selected: completed, jobs: [completed, olderDone, olderFailed] },
  failed: {
    ...filledInput,
    attachments: [base.attachments[0], { ...base.attachments[1], broken: true }],
    selected: failed,
    jobs: [failed, olderDone],
  },
}
