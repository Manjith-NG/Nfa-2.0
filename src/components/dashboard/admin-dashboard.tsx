import {
  Building2,
  CheckCircle,
  ClipboardList,
  Files,
  Inbox,
  RotateCcw,
  Users,
  XCircle,
} from "lucide-react";
import { ApprovalsInsightDashboard } from "@/components/dashboard/approvals-insight-dashboard";
import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSection,
} from "@/components/dashboard/dashboard-shell";
import { DEVELOPER_DEMO_EMAIL } from "@/lib/constants";
import type { ApprovalsInsightCard } from "@/lib/services/approvals-insight-service";
import type { DashboardStats, SessionUser } from "@/types";

export function AdminDashboard({
  user,
  stats,
  entryCards,
  pipelineCards,
}: {
  user: SessionUser;
  stats: DashboardStats & {
    pendingForMe?: number;
    departmentCount?: number;
    clubRequests?: number;
    authorityCount?: number;
  };
  entryCards: ApprovalsInsightCard[];
  pipelineCards: ApprovalsInsightCard[];
}) {
  const isDeveloper = user.email.toLowerCase() === DEVELOPER_DEMO_EMAIL;

  return (
    <div className="space-y-4 sm:space-y-6">
      <DashboardPageHeader
        title={isDeveloper ? "Developer Dashboard" : "System Admin Dashboard"}
        subtitle="University-wide request overview and approval flow"
        actionHref="/requests"
        actionLabel="All Requests"
      />

      <DashboardKpiGrid
        columns={5}
        items={[
          {
            title: "Total Requests",
            value: stats.total,
            icon: Files,
            variant: "default",
            href: "/requests",
          },
          {
            title: "Pending",
            value: stats.pending,
            icon: Inbox,
            variant: "pending",
            href: "/requests?status=PENDING",
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

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="nfa-card flex items-center gap-3 py-4">
          <Building2 className="h-5 w-5 text-nfa-primary" />
          <div>
            <p className="text-xs text-slate-500">Departments</p>
            <p className="text-lg font-bold text-slate-900">{stats.departmentCount ?? "—"}</p>
          </div>
        </div>
        <div className="nfa-card flex items-center gap-3 py-4">
          <Users className="h-5 w-5 text-nfa-primary" />
          <div>
            <p className="text-xs text-slate-500">Active authorities</p>
            <p className="text-lg font-bold text-slate-900">{stats.authorityCount ?? "—"}</p>
          </div>
        </div>
        <div className="nfa-card flex items-center gap-3 py-4">
          <ClipboardList className="h-5 w-5 text-nfa-primary" />
          <div>
            <p className="text-xs text-slate-500">Club requests</p>
            <p className="text-lg font-bold text-slate-900">{stats.clubRequests ?? "—"}</p>
          </div>
        </div>
      </div>

      <DashboardSection title="Role Queues">
        <p className="mb-4 text-sm text-slate-500">
          Click a role or status count to open requests at that approval step. HOD shows all departments — use department filters on the requests page.
        </p>
        <ApprovalsInsightDashboard entryCards={entryCards} pipelineCards={pipelineCards} />
      </DashboardSection>
    </div>
  );
}
