"use client";

import dynamic from "next/dynamic";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  Users,
  UserCog,
  RotateCcw,
} from "lucide-react";
import {
  DashboardKpiGrid,
  DashboardKpiSection,
  DashboardPageHeader,
  DashboardSection,
} from "@/components/dashboard/dashboard-shell";
import { RegistrarChartsSkeleton } from "@/components/dashboard/registrar-charts";
import { RegistrarRecentRequests } from "@/components/dashboard/registrar-recent-requests";
import type { DashboardAnalytics } from "@/lib/services/dashboard-service";
import type { DashboardStats, RequestListItem } from "@/types";

const RegistrarCharts = dynamic(
  () =>
    import("@/components/dashboard/registrar-charts").then((m) => m.RegistrarCharts),
  { loading: () => <RegistrarChartsSkeleton /> }
);

type RegistrarStats = DashboardStats & {
  departmentCount?: number;
  clubRequests?: number;
  authorityCount?: number;
};

export function RegistrarDashboard({
  stats,
  analytics,
  recentRequests = [],
}: {
  stats: RegistrarStats;
  analytics: DashboardAnalytics;
  recentRequests?: RequestListItem[];
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <DashboardPageHeader
        title="Executive Dashboard"
        subtitle="University-wide analytics and authority management"
        actionHref="/requests"
        actionLabel="All Requests"
      />

      <DashboardKpiSection title="Request Overview">
        <DashboardKpiGrid
          columns={4}
          items={[
            { title: "Total Requests", value: stats.total, icon: FileText, href: "/requests" },
            {
              title: "Pending",
              value: stats.pending,
              icon: Clock,
              variant: "pending",
              href: "/requests?pending=1",
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
          ]}
        />
      </DashboardKpiSection>

      <DashboardKpiSection title="Status & Organization">
        <DashboardKpiGrid
          columns={4}
          items={[
            {
              title: "Recheck",
              value: stats.resend,
              icon: RotateCcw,
              variant: "resend",
              href: "/requests?status=RESEND",
            },
            {
              title: "Departments",
              value: stats.departmentCount ?? 0,
              icon: Building2,
              href: "/authorities",
            },
            {
              title: "Club Requests",
              value: stats.clubRequests ?? 0,
              icon: Users,
              href: "/requests?category=CLUB",
            },
            {
              title: "Authorities",
              value: stats.authorityCount ?? 0,
              icon: UserCog,
              href: "/authorities",
            },
          ]}
        />
      </DashboardKpiSection>

      <RegistrarCharts analytics={analytics} />

      <DashboardSection title="Recent Requests" href="/requests" linkLabel="View all">
        <RegistrarRecentRequests items={recentRequests} />
      </DashboardSection>
    </div>
  );
}
