import { useState } from 'react'
import type { Source, Notice } from '../types'
import { useDocumentLookup } from '@/features/documents/hooks'
import { useDocumentDrawer } from '@/features/documents/useDocumentDrawer'
import { findDocument } from '@/features/documents/utils'
import { getDomainStyle, getDomainLabel } from '@/features/domains/utils'
import DocumentDrawer from '@/features/documents/components/DocumentDrawer'
import { ChevronDownIcon, DocumentIcon } from '@/shared/components/icons'
import Button from '@/shared/components/Button'

interface SourceBadgeProps {
  sources?: Source[]
  notice?: Notice
}

export default function SourceBadge({ sources, notice }: SourceBadgeProps) {
  const [open, setOpen] = useState(false)

  const hasSources = !!sources && sources.length > 0
  const { documents, isLoading } = useDocumentLookup(hasSources)
  const {
    doc: drawerDoc,
    open: drawerOpen,
    openDoc,
    closeDoc,
  } = useDocumentDrawer()

  if (!hasSources && !notice) return null

  return (
    <div className="ml-1 mt-1 mb-1">
      {hasSources && (
        <Button variant="secondary" size="sm" onClick={() => setOpen(!open)}>
          <ChevronDownIcon
            width={12}
            height={12}
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          />
          출처 {sources!.length}개 {open ? '닫기' : '보기'}
        </Button>
      )}

      {notice && (
        <p
          role="note"
          className={`text-12 leading-relaxed text-text-muted ${hasSources ? 'mt-1.5' : ''}`}
        >
          {notice.message}
        </p>
      )}

      {hasSources && open && (
        <div className="mt-2 space-y-2">
          {sources.map((s, i) => {
            const matched = findDocument(documents, s)
            const style = getDomainStyle(matched?.domain)
            const title = (matched?.name ?? s.name).replace(/\.[^/.]+$/, '')

            return (
              <button
                key={s.document_id ?? `${s.name}-${i}`}
                type="button"
                disabled={!matched}
                onClick={() => matched && openDoc(matched)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border border-rose-border bg-white text-left transition-colors ${
                  matched
                    ? 'hover:bg-surface-subtle hover:border-brand-soft cursor-pointer'
                    : 'cursor-default'
                }`}
              >
                <div
                  className="shrink-0 flex items-center justify-center"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: style.badgeBg,
                    color: style.bar,
                  }}
                >
                  <DocumentIcon width={18} height={18} />
                </div>

                <div className="min-w-0 flex-1 flex items-center gap-2">
                  <span className="min-w-0 truncate text-14 font-bold text-text-primary">
                    {title}
                  </span>
                  {isLoading && !matched ? (
                    <span className="h-3 w-24 shrink-0 rounded-full bg-surface-subtle animate-pulse" />
                  ) : (
                    <span className="min-w-0 truncate flex items-center gap-1.5 text-12 text-text-muted">
                      {matched?.type && <span>{matched.type}</span>}
                      {matched?.type && matched?.domain && (
                        <span aria-hidden>·</span>
                      )}
                      {matched?.domain && (
                        <span style={{ color: style.badgeText }}>
                          {getDomainLabel(matched.domain)}
                        </span>
                      )}
                      {matched?.domain && matched?.owning_department && (
                        <span aria-hidden>·</span>
                      )}
                      {matched?.owning_department && (
                        <span>{matched.owning_department}</span>
                      )}
                      {!matched && s.page && <span>p.{s.page}</span>}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      <DocumentDrawer doc={drawerDoc} open={drawerOpen} onClose={closeDoc} />
    </div>
  )
}
