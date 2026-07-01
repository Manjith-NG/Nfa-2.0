import { Suspense } from "react";
import { getApprovalsInsight } from "@/lib/services/approvals-insight-service";
import {
  ApprovalsInsightDashboard,
  ApprovalsInsightSkeleton,
} from "@/components/dashboard/approvals-insight-dashboard";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shell";

export const dynamic = "force-dynamic";

async function ApprovalsInsightContent() {
  const insight = await getApprovalsInsight();
  return (
    <ApprovalsInsightDashboard
      entryCards={insight.entryCards}
      pipelineCards={insight.pipelineCards}
    />
  );
}

export default function ApprovalsInsightPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <DashboardPageHeader
        title="Role Queues"
        subtitle="Click a role total or status count to filter requests at that stage. Manage flows from Sections & Flow in Administration."
      />
      <Suspense fallback={<ApprovalsInsightSkeleton />}>
        <ApprovalsInsightContent />
      </Suspense>
    </div>
  );
}
