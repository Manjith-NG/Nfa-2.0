import dynamic from "next/dynamic";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/session";
import { getDashboardStats, listRequestItems } from "@/lib/services/dashboard-service";
import { getApprovalsInsight } from "@/lib/services/approvals-insight-service";
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

const AdminDashboard = dynamic(
  () => import("@/components/dashboard/admin-dashboard").then((m) => m.AdminDashboard)
);

async function RegistrarDashboardLoader({ user }: { user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> }) {
  const [stats, pendingRequests] = await Promise.all([
    getDashboardStats(user),
    listRequestItems(user, { pendingForMe: true, limit: 10 }),
  ]);
  return (
    <RegistrarDashboard
      user={user}
      stats={stats}
      pendingRequests={pendingRequests}
    />
  );
}

async function AdminDashboardLoader({ user }: { user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> }) {
  const [stats, insight] = await Promise.all([getDashboardStats(user), getApprovalsInsight()]);
  return (
    <AdminDashboard
      user={user}
      stats={stats}
      entryCards={insight.entryCards}
      pipelineCards={insight.pipelineCards}
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

  if (user.roleCode === "ADMIN") {
    return <AdminDashboardLoader user={user} />;
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
