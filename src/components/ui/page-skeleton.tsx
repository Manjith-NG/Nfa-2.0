import { cn } from "@/lib/utils";

export function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200/80", className)} />;
}

export function KpiRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="nfa-card flex items-center justify-between gap-3 py-4">
          <div className="space-y-2">
            <Bone className="h-4 w-20" />
            <Bone className="h-8 w-10" />
          </div>
          <Bone className="h-11 w-11 rounded-xl" />
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
