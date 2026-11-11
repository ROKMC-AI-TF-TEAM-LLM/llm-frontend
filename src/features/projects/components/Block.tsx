export function Block({
  icon,
  title,
  action,
  children,
}: {
  icon?: React.ReactNode
  title: string
  action?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-[14px] border border-[#f0e6e8] bg-white">
      <header className="flex items-center gap-2 border-b border-[#f4eced] px-4 py-3">
        {icon && <span className="shrink-0 text-brand">{icon}</span>}
        <h2 className="flex-1 truncate text-[13.5px] font-bold tracking-[-0.01em] text-text-primary">
          {title}
        </h2>
        {action}
      </header>
      {children && <div className="px-4 py-3.5">{children}</div>}
    </section>
  )
}
