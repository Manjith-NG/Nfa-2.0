import { TableSkeleton } from "@/components/ui/page-skeleton";

export default function RequestsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-md bg-slate-200/80" />
        <div className="h-4 w-64 animate-pulse rounded-md bg-slate-200/80" />
      </div>
      <TableSkeleton rows={10} />
    </div>
  );
}
