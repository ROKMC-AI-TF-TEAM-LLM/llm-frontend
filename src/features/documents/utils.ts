import type { DocumentItem } from './types'
import { DOMAINS } from '@/features/domains/utils'

/** 문서 목록 응답에서 문서 배열만 꺼낸다 (배열·items·documents 어느 모양이든) */
export const pickDocuments = (data: unknown): DocumentItem[] => {
  if (Array.isArray(data)) return data as DocumentItem[]
  const d = data as
    { items?: DocumentItem[]; documents?: DocumentItem[] } | null | undefined
  return d?.items ?? d?.documents ?? []
}

export type DocIndexStatus = 'completed' | 'failed' | 'processing'
export const normalizeDocStatus = (
  status: string | null | undefined,
): DocIndexStatus => {
  const s = String(status ?? '').toLowerCase()
  if (/(complete|success|done|indexed|ready|\bok\b)/.test(s)) return 'completed'
  if (/(fail|error|reject|cancel)/.test(s)) return 'failed'
  return 'processing'
}

export const extractDomains = (docs: DocumentItem[]): string[] => {
  const known = DOMAINS.map((d) => d.code)
  const fromDocs = [
    ...new Set(docs.map((d) => d.domain).filter((d): d is string => !!d)),
  ]
  const extra = fromDocs.filter((d) => !known.includes(d))
  return [...known, ...extra]
}

const normalizeDocName = (name: string): string =>
  name
    .replace(/\.[^/.]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

// 문서 식별은 document_id가 정답이다. 출처에 ID가 실려 오면 그것으로 찾고,
// 아직 안 오는 경우에만 이름 매칭으로 떨어진다(동명이문서는 구분이 불가능하다).
export const findDocument = (
  docs: DocumentItem[],
  source: { document_id?: string | null; name: string },
): DocumentItem | undefined => {
  if (source.document_id) {
    const byId = docs.find((d) => d.document_id === source.document_id)
    if (byId) return byId
  }
  return findDocumentByName(docs, source.name)
}

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
  return matches.reduce((latest, d) =>
    appliedTime(d) > appliedTime(latest) ? d : latest,
  )
}

export const formatAppliedAt = (iso?: string | null): string => {
  if (!iso) return ''
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  const d = new Date(t)
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`
}
