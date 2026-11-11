import axios from 'axios'
import { type Message, type Source, noticeFromCode } from './types'
import type { FileAttachment } from '@/shared/types/attachment'
import { normalizeSource } from './api'
import { uuid } from '@/shared/utils/uuid'
import { getDomainLabel } from '@/features/domains/utils'

export const isAbortError = (e: unknown) =>
  (e instanceof DOMException && e.name === 'AbortError') || axios.isCancel(e)

// 스트림 조각이 직렬화된 채({"content":"..."} 또는 그 연속) 저장된 옛 데이터를 풀어낸다.
// 본문 전체가 '{'로 시작할 때만 시도하고, 텍스트 키가 없는 객체는 원문 그대로 둔다.
// (예전에는 본문 어디든 JSON 객체를 찾아 해석해, 답변 속 JSON 예시가 통째로 지워졌다.)
const pickText = (v: unknown): string | undefined => {
  if (!v || typeof v !== 'object') return undefined
  const o = v as Record<string, unknown>
  for (const k of ['content', 'answer', 'text']) {
    if (typeof o[k] === 'string') return o[k] as string
  }
  return undefined
}

const extractContent = (raw: string, _depth = 0): string => {
  if (_depth > 5 || !raw.trimStart().startsWith('{')) return raw
  try {
    const text = pickText(JSON.parse(raw))
    return text !== undefined ? extractContent(text, _depth + 1) : raw
  } catch {
    // 객체 여러 개가 이어 붙은 형태일 수 있다. 아래에서 하나씩 푼다.
  }
  const parts: string[] = []
  let i = 0
  while (i < raw.length) {
    if (raw[i] !== '{') {
      let j = i
      while (j < raw.length && raw[j] !== '{') j++
      parts.push(raw.slice(i, j))
      i = j
      continue
    }
    let j = i + 1
    let braceDepth = 1
    while (j < raw.length && braceDepth > 0) {
      if (raw[j] === '"') {
        j++
        while (j < raw.length && raw[j] !== '"') {
          if (raw[j] === '\\') j++
          j++
        }
      } else if (raw[j] === '{') {
        braceDepth++
      } else if (raw[j] === '}') {
        braceDepth--
      }
      j++
    }
    if (braceDepth !== 0) {
      parts.push(raw.slice(i))
      break
    }
    const slice = raw.slice(i, j)
    let text: string | undefined
    try {
      text = pickText(JSON.parse(slice))
    } catch {
      text = undefined
    }
    parts.push(text !== undefined ? extractContent(text, _depth + 1) : slice)
    i = j
  }
  return parts.join('')
}

type ServerMessage = {
  message_id?: string
  role: 'human' | 'ai'
  content: string
  created_at?: string
  domain?: string | null
  sources?: Source[]
  attachments?: FileAttachment[]
  notice_code?: string | null
}

export const mapServerMessages = (items: ServerMessage[]): Message[] => {
  const mapped: Message[] = items.map((m) => {
    const domainCode = m.role === 'human' && m.domain ? m.domain : undefined
    return {
      id: m.message_id || uuid(),
      role: m.role === 'human' ? 'user' : 'assistant',
      type: 'text' as const,
      content: extractContent(m.content),
      status: 'done' as const,
      createdAt: m.created_at,
      ...(domainCode
        ? { domainCode, domainLabel: getDomainLabel(domainCode) }
        : {}),
      ...(m.sources && m.sources.length > 0
        ? { sources: m.sources.map(normalizeSource) }
        : {}),
      ...(m.attachments && m.attachments.length > 0
        ? { attachments: m.attachments }
        : {}),
      ...(m.role === 'ai' && m.notice_code
        ? { notice: noticeFromCode(m.notice_code) }
        : {}),
    }
  })

  const timeOf = (s?: string) => {
    const n = s ? Date.parse(s) : NaN
    return Number.isNaN(n) ? 0 : n
  }
  const roleRank = (r: 'user' | 'assistant') => (r === 'user' ? 0 : 1)
  const ordered = [...mapped].sort((a, b) => {
    const ta = timeOf(a.createdAt),
      tb = timeOf(b.createdAt)
    if (ta !== tb) return ta - tb
    return roleRank(a.role) - roleRank(b.role)
  })

  const deduped = ordered.filter((msg, i) => {
    if (i === 0) return true
    const prev = ordered[i - 1]
    return !(
      msg.role === prev.role &&
      msg.type === 'text' &&
      prev.type === 'text' &&
      msg.content === prev.content &&
      msg.createdAt === prev.createdAt
    )
  })

  return deduped.filter(
    (msg) =>
      !(
        msg.role === 'assistant' &&
        msg.type === 'text' &&
        msg.content.trim() === ''
      ),
  )
}
