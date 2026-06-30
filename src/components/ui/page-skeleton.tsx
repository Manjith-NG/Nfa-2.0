import { cn } from "@/lib/utils";

export function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200/80", className)} />;
}

export function KpiRowSkeleton({
  count = 5,
  columns = 5,
}: {
  count?: number;
  columns?: 4 | 5;
}) {
  const gridClass =
    columns === 4
      ? "grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      : "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5";

  return (
    <div className={gridClass} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-2 rounded-xl border border-nfa-border bg-white p-3 sm:gap-3 sm:p-4"
        >
          <div className="space-y-1.5">
            <Bone className="h-3 w-16 sm:h-4 sm:w-20" />
            <Bone className="h-6 w-8 sm:h-7 sm:w-10" />
          </div>
          <Bone className="h-9 w-9 rounded-lg sm:h-10 sm:w-10" />
        </div>
      ))}
    </div>
  );
}

export function RequestListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <Bone key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="space-y-2">
        <Bone className="h-8 w-56" />
        <Bone className="h-4 w-72" />
      </div>
      <KpiRowSkeleton count={4} />
      <div className="nfa-card p-6">
        <RequestListSkeleton rows={4} />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="nfa-card space-y-3 p-4" aria-hidden="true">
      <Bone className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Bone key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
