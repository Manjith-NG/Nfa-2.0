import { Suspense } from "react";
import { getCurrentUser } from "@/lib/session";
import { canApproveRequests } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { listRequestItems } from "@/lib/services/dashboard-service";
import { ApprovalsTable } from "@/components/requests/requests-table";
import { TableSkeleton } from "@/components/ui/page-skeleton";

async function ApprovalsList() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!canApproveRequests(user)) {
    redirect("/dashboard");
  }

  const items = await listRequestItems(user, { pendingForMe: true, limit: 50 });
  return <ApprovalsTable items={items} />;
}

export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Approval Queue</h2>
        <p className="text-slate-500">Requests pending your action</p>
      </div>
      <div className="nfa-card overflow-hidden p-0">
        <Suspense fallback={<TableSkeleton rows={8} />}>
          <ApprovalsList />
        </Suspense>
      </div>
    </div>
  );
}
