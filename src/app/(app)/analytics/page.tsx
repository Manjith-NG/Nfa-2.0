import dynamic from "next/dynamic";
import { Suspense } from "react";
import { requireRole } from "@/lib/session";
import { getDashboardAnalytics, getDashboardStats } from "@/lib/services/dashboard-service";
import DashboardLoading from "../dashboard/loading";

const RegistrarDashboard = dynamic(
  () =>
    import("@/components/dashboard/registrar-dashboard").then((m) => m.RegistrarDashboard)
);

async function AnalyticsContent() {
  const user = await requireRole(["REGISTRAR", "OFC"]);
  const [stats, analytics] = await Promise.all([
    getDashboardStats(user),
    getDashboardAnalytics(),
  ]);

  return <RegistrarDashboard stats={stats} analytics={analytics} />;
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <AnalyticsContent />
    </Suspense>
  );
}
