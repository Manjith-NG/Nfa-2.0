import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, RotateCcw, Inbox } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DashboardKpiGrid,
  DashboardSection,
  DashboardWelcome,
} from "@/components/dashboard/dashboard-shell";
import { KpiRowSkeleton, RequestListSkeleton } from "@/components/ui/page-skeleton";
import { getDashboardStats, listRequestItems } from "@/lib/services/dashboard-service";
import { ROLE_LABELS } from "@/lib/constants";
import type { SessionUser } from "@/types";
import type { RoleCode } from "@prisma/client";

async function AuthorityStats({ user }: { user: SessionUser }) {
  const stats = await getDashboardStats(user);
  return (
    <DashboardKpiGrid
      items={[
        { title: "Pending Queue", value: stats.pendingForMe ?? 0, icon: Inbox, variant: "pending" },
        { title: "Approved", value: stats.approved, icon: CheckCircle, variant: "approved" },
        { title: "Rejected", value: stats.rejected, icon: XCircle, variant: "rejected" },
        { title: "Resend", value: stats.resend, icon: RotateCcw, variant: "resend" },
      ]}
    />
  );
}

async function AuthorityQueue({ user }: { user: SessionUser }) {
  const queue = await listRequestItems(user, { pendingForMe: true, limit: 8 });

  if (queue.length === 0) {
    return <p className="py-8 text-center text-slate-500">Queue is empty</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="nfa-table w-full">
        <thead className="bg-slate-50">
          <tr>
            <th>Request</th>
            <th>Department</th>
            <th>Club</th>
            <th>Raised By</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {queue.map((r) => (
            <tr key={r.id}>
              <td>
                <p className="font-medium">{r.title}</p>
                <p className="text-xs text-slate-500">{r.requestNumber}</p>
              </td>
              <td>{r.departmentName}</td>
              <td>{r.clubName ?? "—"}</td>
              <td>{r.raisedByName}</td>
              <td>
                <StatusBadge status={r.status} currentRoleCode={r.currentRoleCode} />
              </td>
              <td>
                <Link
                  href={`/requests/${r.id}`}
                  className="text-sm font-medium text-nfa-primary hover:underline"
                >
                  Review
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export async function AuthorityDashboard({
  user,
  roleCode,
}: {
  user: SessionUser;
  roleCode: RoleCode;
}) {
  return (
    <div className="space-y-6">
      <DashboardWelcome
        user={user}
        subtitle={`${ROLE_LABELS[roleCode]} approval queue and history`}
        actionHref="/approvals"
        actionLabel="Open Queue"
      />

      <Suspense fallback={<KpiRowSkeleton count={4} />}>
        <AuthorityStats user={user} />
      </Suspense>

      <DashboardSection title="Approval Queue" href="/approvals" linkLabel="Full queue">
        <Suspense fallback={<RequestListSkeleton rows={6} />}>
          <AuthorityQueue user={user} />
        </Suspense>
      </DashboardSection>
    </div>
  );
}
