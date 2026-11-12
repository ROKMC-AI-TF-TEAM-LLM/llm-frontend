// 개발자 콘솔에서 mock 서버를 조작하는 도구. 브라우저 콘솔에서 `__mock.help()`로 사용법을 본다.
//
// - 장애 걸기: 다음 요청 '한 번'에만 장애를 낸다. 응답이 끊기거나 실패했을 때 화면이 어떻게 대응하는지 확인한다.
//   한 번 쓰이면 사라지므로 "끊김 → 다시 시도 → 성공"을 그대로 재현할 수 있다.
// - 들여다보기: 최근 요청 기록과 서버 저장소(db)를 본다.

import { db } from './db'

const KINDS = ['drop', 'close', 'error', 'stall', 'empty', 'http'] as const
export type FaultKind = (typeof KINDS)[number]

const KIND_LABELS: Record<FaultKind, string> = {
  drop: '연결 끊김 (스트림 오류)',
  close: 'done 없이 연결 닫힘',
  error: 'error 이벤트 보냄',
  stall: '응답 없이 멈춤',
  empty: '본문 없이 done',
  http: 'HTTP 오류 응답',
}

export interface Fault {
  kind: FaultKind
  /** 본문 조각을 몇 개 보낸 뒤 장애를 낼지 (drop·close·error·stall) */
  after: number
  /** 응답 상태 코드 (http) */
  status: number
  /** 오류 문구 (error·http) */
  message: string
}

interface QueuedFault extends Fault {
  target: string
}

/** 자주 쓰는 대상의 별칭. 별칭이 아니면 "METHOD /경로"에 포함되는지로 고른다 */
const ALIASES: Record<string, (method: string, path: string) => boolean> = {
  stream: (method, path) =>
    method === 'POST' && /\/messages\/stream\/?$/.test(path),
  regenerate: (method, path) =>
    method === 'POST' && /\/regenerate\/?$/.test(path),
}

const matches = (target: string, method: string, path: string) =>
  ALIASES[target]
    ? ALIASES[target](method, path)
    : `${method} ${path}`.includes(target)

const queue: QueuedFault[] = []

/** 이 요청에 걸린 장애가 있으면 꺼낸다 (꺼낸 장애는 대기열에서 사라진다) */
export const takeFault = (method: string, path: string): Fault | null => {
  const index = queue.findIndex((fault) => matches(fault.target, method, path))
  if (index < 0) return null
  const [fault] = queue.splice(index, 1)
  console.info(
    `[mock] 장애 적용: ${KIND_LABELS[fault.kind]} → ${method} ${path}`,
  )
  return fault
}

const STREAM_KINDS: FaultKind[] = ['drop', 'close', 'error', 'stall']

/** 본문 조각을 보내기 직전마다 부른다. 장애를 낼 차례가 되면 그 장애를 돌려준다 */
export const createCutoff = (fault: Fault | null) => {
  const active = fault && STREAM_KINDS.includes(fault.kind) ? fault : null
  let sent = 0
  return () => (active && sent++ >= active.after ? active : null)
}

/** 스트림 도중에 장애를 낸다. 이 generator가 끝나면 호출한 쪽도 스트림을 끝낸다 */
export async function* interruptStream(
  fault: Fault,
  signal: AbortSignal,
): AsyncGenerator<object> {
  switch (fault.kind) {
    case 'drop':
      // generator가 던지면 응답 스트림이 오류로 끝나고, 화면의 reader.read()가 실패한다 (실제 연결 끊김과 같다)
      throw new TypeError('network error')
    case 'error':
      yield { type: 'error', message: fault.message }
      return
    case 'stall':
      // 화면이 요청을 멈출 때까지 아무것도 보내지 않는다
      await new Promise<never>((_, reject) => {
        if (signal.aborted) reject(signal.reason)
        signal.addEventListener('abort', () => reject(signal.reason), {
          once: true,
        })
      })
      return
    default:
      // close: 아무것도 보내지 않고 정상 종료처럼 닫는다
      return
  }
}

export interface RequestRecord {
  time: string
  method: string
  path: string
  status: number
  ms: number
  fault: FaultKind | ''
}

const MAX_RECORDS = 100
const records: RequestRecord[] = []

export const recordRequest = (record: RequestRecord) => {
  records.push(record)
  if (records.length > MAX_RECORDS) records.shift()
  // 콘솔의 '상세(Verbose)' 수준에서만 보인다
  console.debug(
    `[mock] ${record.method} ${record.path} → ${record.status}` +
      (record.fault ? ` (장애: ${record.fault})` : ''),
  )
}

interface FailOptions {
  after?: number
  status?: number
  message?: string
}

const failNext = (
  target: string,
  kind: FaultKind = 'drop',
  options: FailOptions = {},
) => {
  if (!KINDS.includes(kind)) {
    console.warn(`[mock] 장애 종류는 ${KINDS.join(', ')} 중 하나입니다.`)
    return
  }
  const fault: QueuedFault = {
    target,
    kind,
    after: options.after ?? 5,
    status: options.status ?? 500,
    message:
      options.message ??
      (kind === 'http'
        ? 'mock 서버 오류입니다.'
        : '답변을 만드는 중 오류가 발생했습니다.'),
  }
  queue.push(fault)
  const detail =
    kind === 'http'
      ? ` (상태 ${fault.status})`
      : STREAM_KINDS.includes(kind)
        ? ` (본문 ${fault.after}조각 뒤)`
        : ''
  console.info(
    `[mock] 다음 ${target} 요청 한 번: ${KIND_LABELS[kind]}${detail}`,
  )
}

/** 최근에 바뀐 대화의 메시지 (서버에 실제로 저장된 내용) */
const showMessages = (sessionId?: string) => {
  const id =
    sessionId ??
    [...db.sessions].sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0]
      ?.session_id
  const list = id ? (db.messages[id] ?? []) : []
  console.info(`[mock] 대화 ${id ?? '(없음)'}의 서버 메시지`)
  console.table(
    list.map((message) => ({
      id: message.message_id,
      role: message.role,
      length: message.content.length,
      content: message.content.slice(0, 40),
    })),
  )
  return list
}

const HELP = `[mock] 콘솔 도구 사용법

장애 걸기 (다음 요청 한 번에만 적용)
  __mock.failNext('stream')                         새 질문 답변이 5조각 뒤 끊김
  __mock.failNext('regenerate', 'drop', { after: 2 }) 다시 생성이 2조각 뒤 끊김
  __mock.failNext('stream', 'http', { status: 500 })  시작부터 500 응답
  __mock.failNext('GET /sessions', 'http', { status: 401 })  경로 일부로도 지정 가능

  대상 별칭: stream(새 질문), regenerate(다시 생성). 그 밖에는 "METHOD /경로" 일부
  장애 종류:
    drop   연결 끊김 (스트림 오류)          close  done 없이 연결 닫힘
    error  error 이벤트 보냄                stall  응답 없이 멈춤
    empty  본문 없이 done                   http   HTTP 오류 응답
  옵션: after(본문 몇 조각 뒤), status(http 상태), message(오류 문구)

  __mock.faults        걸어 둔 장애 목록
  __mock.clearFaults() 걸어 둔 장애 모두 지우기

들여다보기
  __mock.log()          최근 요청 기록 (요청마다 콘솔 '상세' 수준에도 찍힌다)
  __mock.messages(id?)  대화의 서버 메시지 (id가 없으면 최근 대화)
  __mock.db             서버 저장소 전체`

export interface MockControl {
  failNext: typeof failNext
  readonly faults: QueuedFault[]
  clearFaults: () => void
  log: () => RequestRecord[]
  messages: typeof showMessages
  db: typeof db
  help: () => void
}

declare global {
  interface Window {
    __mock?: MockControl
  }
}

export function installControl() {
  window.__mock = {
    failNext,
    get faults() {
      return [...queue]
    },
    clearFaults: () => {
      queue.length = 0
    },
    log: () => {
      console.table(records)
      return [...records]
    },
    messages: showMessages,
    db,
    help: () => console.info(HELP),
  }
}
