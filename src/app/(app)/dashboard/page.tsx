import dynamic from "next/dynamic";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/session";
import { getDashboardAnalytics, getDashboardStats, listRequestItems } from "@/lib/services/dashboard-service";
import DashboardLoading from "./loading";

const FacultyDashboard = dynamic(
  () => import("@/components/dashboard/faculty-dashboard").then((m) => m.FacultyDashboard)
);

const HodDashboard = dynamic(
  () => import("@/components/dashboard/hod-dashboard").then((m) => m.HodDashboard)
);

const AuthorityDashboard = dynamic(
  () => import("@/components/dashboard/authority-dashboard").then((m) => m.AuthorityDashboard)
);

const RegistrarDashboard = dynamic(
  () => import("@/components/dashboard/registrar-dashboard").then((m) => m.RegistrarDashboard)
);

async function RegistrarDashboardLoader({ user }: { user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> }) {
  const [stats, analytics, recentRequests] = await Promise.all([
    getDashboardStats(user),
    getDashboardAnalytics(),
    listRequestItems(user, { limit: 10 }),
  ]);
  return (
    <RegistrarDashboard
      stats={stats}
      analytics={analytics}
      recentRequests={recentRequests}
    />
  );
}

async function DashboardContent() {
  const user = await getCurrentUser();
  if (!user) return null;

  if (user.roleCode === "FACULTY") {
    return <FacultyDashboard user={user} />;
  }

  if (user.roleCode === "HOD") {
    return <HodDashboard user={user} />;
  }

  if (["IQAC", "PMSEB", "HR", "COE", "CLUB_AUTHORITY"].includes(user.roleCode)) {
    return <AuthorityDashboard user={user} roleCode={user.roleCode} />;
  }

  if (["REGISTRAR", "OFC"].includes(user.roleCode)) {
    return <RegistrarDashboardLoader user={user} />;
  }

  return <FacultyDashboard user={user} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
