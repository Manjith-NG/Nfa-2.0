import { CheckCircle, XCircle, RotateCcw, Inbox } from "lucide-react";
import { ApprovalsInsightDashboard } from "@/components/dashboard/approvals-insight-dashboard";
import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSection,
} from "@/components/dashboard/dashboard-shell";
import { RegistrarRecentRequests } from "@/components/dashboard/registrar-recent-requests";
import { ROLE_LABELS } from "@/lib/constants";
import type { ApprovalsInsightCard } from "@/lib/services/approvals-insight-service";
import type { DashboardStats, RequestListItem, SessionUser } from "@/types";

export function RegistrarDashboard({
  user,
  stats,
  pendingRequests = [],
  entryCards = [],
  pipelineCards = [],
}: {
  user: SessionUser;
  stats: DashboardStats & { pendingForMe?: number };
  pendingRequests?: RequestListItem[];
  entryCards?: ApprovalsInsightCard[];
  pipelineCards?: ApprovalsInsightCard[];
}) {
  const roleCode = user.roleCode;
  const roleLabel = ROLE_LABELS[roleCode] ?? roleCode;
  const acceptedLabel = roleCode === "OFC" ? "Verified" : "Accepted";

  return (
    <div className="space-y-4 sm:space-y-6">
      <DashboardPageHeader
        title={`${roleLabel} Dashboard`}
        subtitle={`Your ${roleLabel} approval queue and decision history`}
        actionHref="/approvals"
        actionLabel="Open Queue"
      />

      <DashboardKpiGrid
        columns={4}
        items={[
          {
            title: "Pending Queue",
            value: stats.pendingForMe ?? stats.pending,
            icon: Inbox,
            variant: "pending",
            href: `/requests?role=${roleCode}&stage=pending`,
          },
          {
            title: acceptedLabel,
            value: stats.completed ?? 0,
            icon: CheckCircle,
            variant: "approved",
            href: `/requests?role=${roleCode}&stage=accepted`,
          },
          {
            title: "Rejected",
            value: stats.rejected,
            icon: XCircle,
            variant: "rejected",
            href: `/requests?role=${roleCode}&stage=rejected`,
          },
          {
            title: "Recheck",
            value: stats.resend,
            icon: RotateCcw,
            variant: "resend",
            href: `/requests?role=${roleCode}&stage=resend`,
          },
        ]}
      />

      <DashboardSection
        title="Pending Requests"
        href={`/requests?role=${roleCode}&stage=pending`}
        linkLabel="View queue"
      >
        <RegistrarRecentRequests items={pendingRequests} emptyMessage="No pending requests in your queue" />
      </DashboardSection>

      {(entryCards.length > 0 || pipelineCards.length > 0) && (
        <DashboardSection title="Role Queues" href="/approvals/insight" linkLabel="Open full view">
          <p className="mb-4 text-sm text-slate-500">
            Approval counts by role — click a card to filter requests at that stage.
          </p>
          <ApprovalsInsightDashboard entryCards={entryCards} pipelineCards={pipelineCards} />
        </DashboardSection>
      )}
    </div>
  );
}
