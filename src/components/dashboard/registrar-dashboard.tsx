"use client";

import dynamic from "next/dynamic";
import { CheckCircle, XCircle, RotateCcw, Inbox } from "lucide-react";
import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSection,
} from "@/components/dashboard/dashboard-shell";
import { RegistrarChartsSkeleton } from "@/components/dashboard/registrar-charts";
import { RegistrarRecentRequests } from "@/components/dashboard/registrar-recent-requests";
import { ROLE_LABELS } from "@/lib/constants";
import type { DashboardAnalytics } from "@/lib/services/dashboard-service";
import type { DashboardStats, RequestListItem, SessionUser } from "@/types";

const RegistrarCharts = dynamic(
  () =>
    import("@/components/dashboard/registrar-charts").then((m) => m.RegistrarCharts),
  { loading: () => <RegistrarChartsSkeleton /> }
);

export function RegistrarDashboard({
  user,
  stats,
  analytics,
  recentRequests = [],
}: {
  user: SessionUser;
  stats: DashboardStats & { pendingForMe?: number };
  analytics: DashboardAnalytics;
  recentRequests?: RequestListItem[];
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

      <RegistrarCharts analytics={analytics} />

      <DashboardSection title="Recent at Your Stage" href={`/requests?role=${roleCode}`} linkLabel="View all">
        <RegistrarRecentRequests items={recentRequests} />
      </DashboardSection>
    </div>
  );
}
