import dynamic from "next/dynamic";
import { Suspense } from "react";
import { requirePermission } from "@/lib/session";
import { getDashboardAnalytics } from "@/lib/services/dashboard-service";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shell";
import { RegistrarChartsSkeleton } from "@/components/dashboard/registrar-charts";
import { Bone } from "@/components/ui/page-skeleton";

const RegistrarCharts = dynamic(
  () =>
    import("@/components/dashboard/registrar-charts").then((m) => m.RegistrarCharts),
  { loading: () => <RegistrarChartsSkeleton /> }
);

async function AnalyticsContent() {
  await requirePermission("analytics:view");
  const analytics = await getDashboardAnalytics();

  return (
    <div className="space-y-4 sm:space-y-6">
      <DashboardPageHeader
        title="Analytics"
        subtitle="University-wide request trends, section breakdowns, and approval funnel"
      />
      <RegistrarCharts analytics={analytics} />
    </div>
  );
}

function AnalyticsLoading() {
  return (
    <div className="space-y-4 sm:space-y-6" aria-busy="true" aria-label="Loading analytics">
      <div className="space-y-2">
        <Bone className="h-8 w-40" />
        <Bone className="h-4 w-72" />
      </div>
      <RegistrarChartsSkeleton />
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsLoading />}>
      <AnalyticsContent />
    </Suspense>
  );
}
