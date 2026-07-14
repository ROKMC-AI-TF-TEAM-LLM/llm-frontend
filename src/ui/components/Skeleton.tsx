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
      <td className="px-4 py-3"><Skeleton className="h-4 w-14" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
      <td className="px-4 py-3"><Skeleton className="h-5 w-14 rounded-full" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
      <td className="px-4 py-3"><Skeleton className="h-6 w-12 rounded" /></td>
    </tr>
  );
}

export function SearchPageSkeleton() {
  return (
    <div className="flex flex-col h-full px-6 pt-16 pb-6">
      <div className="max-w-2xl w-full mx-auto flex flex-col flex-1">
        <Skeleton className="h-8 w-32 mx-auto mb-8" />
        <Skeleton className="h-11 w-full rounded-full mb-8" />
        <Skeleton className="h-4 w-16 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col gap-2 p-4 rounded-2xl border border-surface-border">
              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                <Skeleton className="h-4 flex-1" />
              </div>
              <Skeleton className="h-3 w-2/5 ml-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 문서 리스트 한 행: 색 막대 + 아이콘 + (이름/부서) + 우측 메타
function RagRowSkeleton() {
  return (
    <div className="w-full flex items-center gap-4 py-3 pl-2 pr-5 border-b border-surface-border">
      <Skeleton className="shrink-0 w-[5px] h-10 rounded-full" />
      <Skeleton className="shrink-0 w-10 h-10 rounded-[11px]" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-[15px] w-2/3 rounded" />
        <Skeleton className="mt-2 h-[13px] w-24 rounded" />
      </div>
      <Skeleton className="shrink-0 h-3.5 w-16 rounded" />
    </div>
  );
}

// 리스트 영역만 (데이터 로딩 중 — 헤더/탭은 이미 떠 있음)
export function RagListSkeleton() {
  return (
    <div className="flex flex-col mt-1">
      {[...Array(8)].map((_, i) => <RagRowSkeleton key={i} />)}
    </div>
  );
}

// 페이지 전체 (lazy 청크 로딩 중 — 헤더/탭까지 포함)
export function RagPageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-8 py-12">
      {/* 헤더: 제목·건수 / 검색 */}
      <div className="flex items-center justify-between gap-6 mb-6">
        <div className="flex items-baseline gap-3">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="h-10 w-full max-w-[300px] rounded-xl" />
      </div>

      {/* 도메인 탭 */}
      <div className="flex items-center gap-1 border-b border-surface-border pb-2.5">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-14 mx-3 rounded" />
        ))}
      </div>

      <RagListSkeleton />
    </div>
  );
}

export function AdminPageSkeleton() {
  return (
    <div className="min-h-full bg-white p-8">
      <Skeleton className="h-8 w-48 mb-8" />

      <div className="mb-10">
        <Skeleton className="h-5 w-16 mb-3" />
        <div className="rounded-xl border border-surface-border overflow-hidden">
          <table className="w-full table-fixed text-sm">
            <tbody>
              {[...Array(2)].map((_, i) => <AdminRowSkeleton key={i} />)}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <Skeleton className="h-5 w-16 mb-3" />
        <div className="flex gap-2 mb-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-16 rounded-full" />)}
        </div>
        <div className="rounded-xl border border-surface-border overflow-hidden">
          <table className="w-full table-fixed text-sm">
            <tbody>
              {[...Array(5)].map((_, i) => <AdminRowSkeleton key={i} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
