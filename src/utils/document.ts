import type { DocumentItem } from '../types/document'

// ─── 도메인 색상 ──────────────────────────────────────────────

export interface DomainStyle {
  bar: string
  badgeBg: string
  badgeText: string
}

const DOMAIN_PALETTE: DomainStyle[] = [
  { bar: '#e4002b', badgeBg: '#fdeef1', badgeText: '#c0002a' },
  { bar: '#3b6fe0', badgeBg: '#eaf0fd', badgeText: '#2a54b8' },
  { bar: '#e0952b', badgeBg: '#fbf1e2', badgeText: '#b3720f' },
  { bar: '#10b981', badgeBg: '#e6f7f1', badgeText: '#0a7d5a' },
  { bar: '#8b5cf6', badgeBg: '#f1ecfe', badgeText: '#6b3fd4' },
  { bar: '#0ea5e9', badgeBg: '#e5f5fd', badgeText: '#0b7fb4' },
  { bar: '#ec4899', badgeBg: '#fdecf4', badgeText: '#c02a76' },
  { bar: '#64748b', badgeBg: '#eef1f5', badgeText: '#475569' },
]

const NEUTRAL: DomainStyle = { bar: '#c9aab2', badgeBg: '#f6f0f2', badgeText: '#8a7a80' }

const hashString = (s: string): number => {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export const getDomainStyle = (domain?: string | null): DomainStyle => {
  if (!domain) return NEUTRAL
  return DOMAIN_PALETTE[hashString(domain) % DOMAIN_PALETTE.length]
}

// ─── 도메인 목록 & 라벨 ───────────────────────────────────────
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

export const getDomainLabel = (domain: string): string => DOMAIN_LABEL[domain] ?? domain

export const extractDomains = (docs: DocumentItem[]): string[] => {
  const known = DOMAINS.map((d) => d.code)
  const fromDocs = [...new Set(docs.map((d) => d.domain).filter((d): d is string => !!d))]
  const extra = fromDocs.filter((d) => !known.includes(d))
  return [...known, ...extra]
}

// ─── 이름 매칭 ───────────────────────────────────────────────
const normalizeDocName = (name: string): string =>
  name
    .replace(/\.[^/.]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

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
export const formatAppliedAt = (iso?: string | null): string => {
  if (!iso) return ''
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  const d = new Date(t)
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`
}
