import { Suspense } from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle,
  XCircle,
  RotateCcw,
  Inbox,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DashboardKpiGrid,
  DashboardSection,
  DashboardWelcome,
} from "@/components/dashboard/dashboard-shell";
import { KpiRowSkeleton, RequestListSkeleton } from "@/components/ui/page-skeleton";
import { getDashboardStats, listRequestItems } from "@/lib/services/dashboard-service";
import type { SessionUser } from "@/types";

async function HodStats({ user }: { user: SessionUser }) {
  const stats = await getDashboardStats(user);
  return (
    <DashboardKpiGrid
      items={[
        { title: "Department Requests", value: stats.total, icon: FileText },
        { title: "Pending Approvals", value: stats.pendingForMe ?? 0, icon: Inbox, variant: "pending" },
        { title: "Approved", value: stats.approved, icon: CheckCircle, variant: "approved" },
        { title: "Rejected", value: stats.rejected, icon: XCircle, variant: "rejected" },
        { title: "Recheck", value: stats.resend, icon: RotateCcw, variant: "resend" },
      ]}
    />
  );
}

async function HodPendingList({ user }: { user: SessionUser }) {
  const pending = await listRequestItems(user, { pendingForMe: true, limit: 5 });

  if (pending.length === 0) {
    return <p className="py-6 text-center text-slate-500">No pending approvals</p>;
  }

  return (
    <div className="space-y-3">
      {pending.map((r) => (
        <Link
          key={r.id}
          href={`/requests/${r.id}`}
          className="block rounded-lg border border-nfa-border p-4 hover:bg-slate-50"
        >
          <div className="flex justify-between gap-3">
            <div>
              <p className="font-medium">{r.title}</p>
              <p className="text-sm text-slate-500">{r.raisedByName}</p>
            </div>
            <StatusBadge status={r.status} currentRoleCode={r.currentRoleCode} />
          </div>
        </Link>
      ))}
    </div>
  );
}

export async function HodDashboard({ user }: { user: SessionUser }) {
  return (
    <div className="space-y-6">
      <DashboardWelcome
        user={user}
        subtitle="Department approvals and requests"
        actionHref="/approvals"
        actionLabel="Review Pending"
      />

      <Suspense fallback={<KpiRowSkeleton count={5} />}>
        <HodStats user={user} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection title="Pending Approvals" href="/approvals" linkLabel="View queue">
          <Suspense fallback={<RequestListSkeleton rows={4} />}>
            <HodPendingList user={user} />
          </Suspense>
        </DashboardSection>

        <div className="nfa-card">
          <h3 className="mb-4 font-semibold text-slate-900">Quick Actions</h3>
          <div className="grid gap-2">
            <Link href="/approvals" className="nfa-btn-primary text-center">
              Review Pending
            </Link>
            <Link href="/requests/department" className="nfa-btn-secondary text-center">
              Department Requests
            </Link>
            <Link href="/requests/new" className="nfa-btn-secondary text-center">
              Raise My Request
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
