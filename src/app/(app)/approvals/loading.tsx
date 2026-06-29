import { TableSkeleton } from "@/components/ui/page-skeleton";

export default function ApprovalsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-md bg-slate-200/80" />
        <div className="h-4 w-56 animate-pulse rounded-md bg-slate-200/80" />
      </div>
      <TableSkeleton rows={8} />
    </div>
  );
}
