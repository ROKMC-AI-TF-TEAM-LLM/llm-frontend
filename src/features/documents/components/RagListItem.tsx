import type { DocumentItem } from '../types'
import {
  DomainBadge,
  DomainBar,
  DomainDocIcon,
} from '@/features/domains/components/DomainMarks'
import { formatAppliedAt } from '../utils'
import { ArrowRightIcon } from '@/shared/components/icons'

interface RagListItemProps {
  doc: DocumentItem
  onClick?: () => void
}

const RagListItem = ({ doc, onClick }: RagListItemProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full flex items-center gap-4 py-3 pl-2 pr-5 text-left bg-surface border-b border-surface-border transition-colors hover:bg-surface-subtle"
    >
      <DomainBar domain={doc.domain} className="shrink-0 h-10 w-[5px]" />

      <DomainDocIcon domain={doc.domain} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="min-w-0 truncate text-15 font-bold text-text-primary">
            {doc.name}
          </span>
          {doc.type && (
            <span className="shrink-0 text-11 font-medium px-2 py-0.5 rounded-md bg-surface-subtle text-text-secondary">
              {doc.type}
            </span>
          )}
          {doc.domain && <DomainBadge domain={doc.domain} />}
        </div>
        {doc.owning_department && (
          <p className="mt-1 text-13 text-text-secondary truncate">
            {doc.owning_department}
          </p>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-4">
        {doc.applied_at && (
          <span className="text-13 text-text-muted whitespace-nowrap">
            {formatAppliedAt(doc.applied_at)}
          </span>
        )}
        <span
          className="text-text-muted transition-all duration-200 group-hover:text-[var(--color-brand)] group-hover:translate-x-0.5"
          aria-hidden
        >
          <ArrowRightIcon width="18" height="18" />
        </span>
      </div>
    </button>
  )
}

export default RagListItem
