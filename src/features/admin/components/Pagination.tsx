export const Pagination = ({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (p: number) => void
}) => {
  if (totalPages <= 1) return null

  const getPages = (): (number | '...')[] => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '...')[] = [1]
    if (page > 3) pages.push('...')
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    )
      pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      {getPages().map((p, i) =>
        p === '...' ? (
          <span
            key={`e-${i}`}
            className="w-8 h-8 flex items-center justify-center text-text-muted text-sm"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
              page === p
                ? 'bg-brand text-white'
                : 'bg-surface text-text-secondary border border-surface-border hover:bg-surface-subtle'
            }`}
          >
            {p}
          </button>
        ),
      )}
    </div>
  )
}
