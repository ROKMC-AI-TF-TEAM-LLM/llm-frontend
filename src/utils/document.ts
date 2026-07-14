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

// ─── 날짜 ────────────────────────────────────────────────────
// applied_at은 ISO 8601(2026-07-14T04:25:49.197Z) → "2026.7.14"
export const formatAppliedAt = (iso?: string | null): string => {
  if (!iso) return ''
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  const d = new Date(t)
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`
}
