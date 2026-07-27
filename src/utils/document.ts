import type { DocumentItem } from '../types/document'

// ─── 도메인 색상 ──────────────────────────────────────────────
// 도메인 값(HR, MANUAL, ...)을 프론트가 미리 알 수 없으므로 색을 고정 매핑할 수 없다.
// → 팔레트를 두고 도메인 문자열을 해시해 '항상 같은 색'이 나오도록 결정적으로 배정한다.
//   도메인이 몇 개든, 새로 추가돼도 코드 수정 불필요.

export interface DomainStyle {
  bar: string       // 리스트 좌측 색 막대
  badgeBg: string   // 아이콘/뱃지 배경
  badgeText: string // 뱃지 텍스트 색
}

const DOMAIN_PALETTE: DomainStyle[] = [
  { bar: '#e4002b', badgeBg: '#fdeef1', badgeText: '#c0002a' }, // red (brand)
  { bar: '#3b6fe0', badgeBg: '#eaf0fd', badgeText: '#2a54b8' }, // blue
  { bar: '#e0952b', badgeBg: '#fbf1e2', badgeText: '#b3720f' }, // amber
  { bar: '#10b981', badgeBg: '#e6f7f1', badgeText: '#0a7d5a' }, // green
  { bar: '#8b5cf6', badgeBg: '#f1ecfe', badgeText: '#6b3fd4' }, // violet
  { bar: '#0ea5e9', badgeBg: '#e5f5fd', badgeText: '#0b7fb4' }, // sky
  { bar: '#ec4899', badgeBg: '#fdecf4', badgeText: '#c02a76' }, // pink
  { bar: '#64748b', badgeBg: '#eef1f5', badgeText: '#475569' }, // slate
]

const NEUTRAL: DomainStyle = { bar: '#c9aab2', badgeBg: '#f6f0f2', badgeText: '#8a7a80' }

// 문자열 → 안정적인 정수 해시 (같은 도메인은 언제나 같은 색)
const hashString = (s: string): number => {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0 // 32bit 정수 유지
  }
  return Math.abs(h)
}

export const getDomainStyle = (domain?: string | null): DomainStyle => {
  if (!domain) return NEUTRAL
  return DOMAIN_PALETTE[hashString(domain) % DOMAIN_PALETTE.length]
}

// ─── 도메인 목록 & 라벨 ───────────────────────────────────────
// TODO(API): GET /capabilities 가 생기면 서버 응답으로 교체한다.
//            (그때 아래 DOMAINS 상수와 extractDomains의 폴백을 삭제)
//            서버는 코드(HR, MANUAL)만 주므로 한글 라벨은 프론트가 매핑한다.
// 관리자 문서 색인 상태 정규화.
// 서버가 대소문자(COMPLETED/completed)나 다른 표현을 줘도 완료/실패/처리중으로 인식되게 폭넓게 매칭한다.
// - 완료: complete/success/done/indexed/ready/ok
// - 실패: fail/error/reject
// - 처리 중: queued(대기열)/pending/processing/running/indexing 등 그 외 진행 상태
// (queued는 색인 워커가 아직 집어가지 않은 '대기' 상태 → 사용자에겐 처리 중으로 보여준다)
export type DocIndexStatus = 'completed' | 'failed' | 'processing'
export const normalizeDocStatus = (status: string | null | undefined): DocIndexStatus => {
  const s = String(status ?? '').toLowerCase()
  if (/(complete|success|done|indexed|ready|\bok\b)/.test(s)) return 'completed'
  if (/(fail|error|reject|cancel)/.test(s)) return 'failed'
  return 'processing'
}

export const DOMAINS: { code: string; label: string }[] = [
  { code: 'HR', label: '인사·복지' },
  { code: 'TECH', label: '정보화·보안' },
  { code: 'FINANCE_LEGAL', label: '재무·법무' },
  { code: 'GENERAL', label: '일반' },
  { code: 'MANUAL', label: '교범' },
  { code: 'DIRECTIVE', label: '훈령' },
]

const DOMAIN_LABEL: Record<string, string> = Object.fromEntries(
  DOMAINS.map((d) => [d.code, d.label]),
)

// 정의에 없는 코드가 오면(백엔드가 도메인을 추가한 경우) 코드를 그대로 보여준다.
export const getDomainLabel = (domain: string): string => DOMAIN_LABEL[domain] ?? domain

/**
 * 탭에 노출할 도메인 목록.
 * 정의된 6종을 항상 보여주고, 서버가 그 외 도메인을 주면 뒤에 덧붙인다
 * (프론트에 없는 도메인이 생겨도 탭이 누락되지 않도록).
 */
export const extractDomains = (docs: DocumentItem[]): string[] => {
  const known = DOMAINS.map((d) => d.code)
  const fromDocs = [...new Set(docs.map((d) => d.domain).filter((d): d is string => !!d))]
  const extra = fromDocs.filter((d) => !known.includes(d))
  return [...known, ...extra]
}

// ─── 이름 매칭 ───────────────────────────────────────────────
// 채팅 SSE의 출처(Source)는 name·page만 준다. 상세 정보(종류·부서·적용일)는
// 문서 목록(GET /documents)에만 있으므로, 출처를 클릭하면 '이름'으로 문서를 찾아야 한다.
// 이때 SSE 출처명은 확장자가 없고(예: "국방 정보화업무 훈령(...)")
// 문서 목록의 name은 확장자가 붙어 있어(".pdf") 그대로 비교하면 안 맞는다.
// → 확장자를 떼고 공백을 정규화해 비교한다.
const normalizeDocName = (name: string): string =>
  name
    .replace(/\.[^/.]+$/, '') // 확장자 제거
    .replace(/\s+/g, ' ')     // 연속 공백 → 하나
    .trim()
    .toLowerCase()

/**
 * 문서 목록에서 출처 이름과 일치하는 문서를 찾는다. 없으면 undefined.
 *
 * 동명 문서가 여러 개면 applied_at(적용일)이 가장 최신인 것을 고른다 — 개정판이
 * 올라온 경우 옛 버전의 상세를 보여주지 않기 위함.
 * (applied_at이 없는 문서는 가장 오래된 것으로 취급한다)
 * TODO: 서버가 출처에 문서 ID를 실어주면 ID 매칭으로 바꾼다.
 */
export const findDocumentByName = (
  docs: DocumentItem[],
  sourceName: string,
): DocumentItem | undefined => {
  const target = normalizeDocName(sourceName)
  const matches = docs.filter((d) => normalizeDocName(d.name) === target)
  if (matches.length <= 1) return matches[0]

  const appliedTime = (d: DocumentItem): number => {
    const t = d.applied_at ? Date.parse(d.applied_at) : NaN
    return Number.isNaN(t) ? -Infinity : t
  }
  return matches.reduce((latest, d) => (appliedTime(d) > appliedTime(latest) ? d : latest))
}

// ─── 날짜 ────────────────────────────────────────────────────
// applied_at은 ISO 8601(2026-07-14T04:25:49.197Z) → "2026.7.14"
export const formatAppliedAt = (iso?: string | null): string => {
  if (!iso) return ''
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  const d = new Date(t)
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`
}
