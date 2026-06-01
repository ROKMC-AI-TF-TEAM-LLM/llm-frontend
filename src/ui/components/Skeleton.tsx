export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className ?? ''}`} />;
}

export function SessionItemSkeleton() {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <Skeleton className="w-1.5 h-1.5 rounded-full shrink-0" />
      <Skeleton className="h-4 flex-1" />
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="w-64 flex flex-col h-screen bg-surface border-r border-surface-border shrink-0">
      <div className="flex items-center justify-between px-5 py-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-6" />
      </div>
      <div className="px-3 space-y-1 mt-1">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-lg" />)}
      </div>
      <div className="px-6 mt-4 mb-2">
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex-1 px-3 space-y-0.5 overflow-hidden">
        {[...Array(7)].map((_, i) => <SessionItemSkeleton key={i} />)}
      </div>
      <div className="px-3 pb-4">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function MessagesSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex gap-3">
        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-48 rounded-2xl" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-36 rounded-2xl" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function SearchSessionCardSkeleton() {
  return (
    <div className="flex flex-col gap-1.5 p-4 rounded-2xl border border-surface-border">
      <div className="flex items-center gap-2">
        <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <Skeleton className="h-3 w-2/5 ml-10" />
    </div>
  );
}

export function SearchResultSkeleton() {
  return (
    <div className="w-full flex items-start gap-3 pl-4.5 pr-3 py-3 rounded-2xl">
      <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-2/5" />
      </div>
    </div>
  );
}

export function AdminRowSkeleton() {
  return (
    <tr className="border-b">
      <td className="px-5 py-3"><Skeleton className="h-4 w-20" /></td>
      <td className="px-5 py-3"><Skeleton className="h-4 w-40" /></td>
      <td className="px-5 py-3"><Skeleton className="h-4 w-20" /></td>
      <td className="px-5 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
      <td className="px-5 py-3"><Skeleton className="h-4 w-24" /></td>
      <td className="px-5 py-3"><Skeleton className="h-7 w-14 rounded" /></td>
    </tr>
  );
}
