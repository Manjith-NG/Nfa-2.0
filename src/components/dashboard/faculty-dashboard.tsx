import { Suspense } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
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
import { formatDate } from "@/lib/utils";

async function FacultyStats({ user }: { user: SessionUser }) {
  const stats = await getDashboardStats(user);

  return (
    <DashboardKpiGrid
      items={[
        { title: "Total Requests", value: stats.total, icon: FileText, href: "/requests" },
        {
          title: "Pending",
          value: stats.pending,
          icon: Clock,
          variant: "pending",
          href: "/requests?pending=1",
        },
        {
          title: "Verified",
          value: stats.completed ?? 0,
          icon: CheckCircle,
          variant: "approved",
          href: "/requests?status=COMPLETED",
        },
        {
          title: "Rejected",
          value: stats.rejected,
          icon: XCircle,
          variant: "rejected",
          href: "/requests?status=REJECTED",
        },
        {
          title: "Recheck",
          value: stats.resend,
          icon: RotateCcw,
          variant: "resend",
          href: "/requests?status=RESEND",
        },
      ]}
    />
  );
}

async function FacultyRecentRequests({ user }: { user: SessionUser }) {
  const requests = await listRequestItems(user, { limit: 5 });

  if (requests.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-slate-500">No requests yet.</p>
        <Link href="/requests/new" className="mt-3 inline-block text-sm font-medium text-nfa-primary hover:underline">
          Raise your first request
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="nfa-table w-full">
        <thead>
          <tr className="border-b border-nfa-border text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="pb-3 font-medium">Request</th>
            <th className="pb-3 font-medium">Reference</th>
            <th className="pb-3 font-medium">Submitted</th>
            <th className="pb-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id} className="border-b border-nfa-border/60 last:border-0">
              <td className="py-3.5">
                <Link
                  href={`/requests/${r.id}`}
                  className="font-medium text-slate-900 hover:text-nfa-primary"
                >
                  {r.title}
                </Link>
              </td>
              <td className="py-3.5 text-sm text-slate-500">{r.requestNumber}</td>
              <td className="py-3.5 text-sm text-slate-500">{formatDate(r.createdAt)}</td>
              <td className="py-3.5">
                <StatusBadge status={r.status} currentRoleCode={r.currentRoleCode} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export async function FacultyDashboard({ user }: { user: SessionUser }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <DashboardWelcome
        user={user}
        subtitle="Track and manage your approval requests"
        actionHref="/requests/new"
        actionLabel="Raise Request"
      />

      <Suspense fallback={<KpiRowSkeleton count={5} />}>
        <FacultyStats user={user} />
      </Suspense>

      <DashboardSection title="Recent Requests" href="/requests" linkLabel="View all">
        <Suspense fallback={<RequestListSkeleton rows={5} />}>
          <FacultyRecentRequests user={user} />
        </Suspense>
      </DashboardSection>
    </div>
  );
}
