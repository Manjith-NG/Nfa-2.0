import { Bone, KpiRowSkeleton, RequestListSkeleton } from "@/components/ui/page-skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="rounded-2xl border border-nfa-border bg-gradient-to-br from-nfa-primary/[0.06] via-white to-nfa-accent/[0.04] px-6 py-5">
        <Bone className="h-4 w-24" />
        <Bone className="mt-2 h-8 w-48" />
        <Bone className="mt-2 h-4 w-64" />
      </div>
      <KpiRowSkeleton count={5} />
      <div className="nfa-card overflow-hidden p-0">
        <div className="border-b border-nfa-border px-6 py-4">
          <Bone className="h-5 w-36" />
        </div>
        <div className="p-6">
          <RequestListSkeleton rows={5} />
        </div>
      </div>
    </div>
  );
}
