import { Suspense } from "react";
import { getApprovalsInsight } from "@/lib/services/approvals-insight-service";
import {
  ApprovalsInsightDashboard,
  ApprovalsInsightSkeleton,
} from "@/components/dashboard/approvals-insight-dashboard";

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Role Queues</h2>
        <p className="text-slate-500">
          View requests at each approval stage. Manage flows and sections from Administration in the sidebar.
        </p>
      </div>
      <Suspense fallback={<ApprovalsInsightSkeleton />}>
        <ApprovalsInsightContent />
      </Suspense>
    </div>
  );
}
