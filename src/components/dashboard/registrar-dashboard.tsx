"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
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
import { KpiCard } from "@/components/ui/kpi-card";
import { RegistrarChartsSkeleton } from "@/components/dashboard/registrar-charts";
import { RegistrarRecentRequests } from "@/components/dashboard/registrar-recent-requests";
import { ApprovalsInsightDashboard } from "@/components/dashboard/approvals-insight-dashboard";
import type { DashboardAnalytics } from "@/lib/services/dashboard-service";
import type { ApprovalsInsightCard } from "@/lib/services/approvals-insight-service";
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
  approvalsInsight,
}: {
  stats: RegistrarStats;
  analytics: DashboardAnalytics;
  recentRequests?: RequestListItem[];
  approvalsInsight?: {
    entryCards: ApprovalsInsightCard[];
    pipelineCards: ApprovalsInsightCard[];
  };
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Executive Dashboard</h2>
        <p className="text-slate-500">University-wide analytics and authority management</p>
      </div>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Request Overview
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="Total Requests" value={stats.total} icon={FileText} href="/requests" />
          <KpiCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            variant="pending"
            href="/requests?pending=1"
          />
          <KpiCard
            title="Verified"
            value={stats.completed ?? 0}
            icon={CheckCircle}
            variant="approved"
            href="/requests?status=COMPLETED"
          />
          <KpiCard
            title="Rejected"
            value={stats.rejected}
            icon={XCircle}
            variant="rejected"
            href="/requests?status=REJECTED"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Status &amp; Organization
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Recheck"
            value={stats.resend}
            icon={RotateCcw}
            variant="resend"
            href="/requests?status=RESEND"
          />
          <KpiCard
            title="Departments"
            value={stats.departmentCount ?? 0}
            icon={Building2}
            href="/authorities"
          />
          <KpiCard
            title="Club Requests"
            value={stats.clubRequests ?? 0}
            icon={Users}
            href="/requests?category=CLUB"
          />
          <KpiCard
            title="Authorities"
            value={stats.authorityCount ?? 0}
            icon={UserCog}
            href="/authorities"
          />
        </div>
      </section>

      {approvalsInsight && (
        <ApprovalsInsightDashboard
          entryCards={approvalsInsight.entryCards}
          pipelineCards={approvalsInsight.pipelineCards}
        />
      )}

      <RegistrarCharts analytics={analytics} />

      <section className="nfa-card overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-nfa-border px-6 py-4">
          <h3 className="font-semibold text-slate-900">Recent Requests</h3>
          <Link href="/requests" className="text-sm font-medium text-nfa-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="p-6 pt-0">
          <RegistrarRecentRequests items={recentRequests} />
        </div>
      </section>
    </div>
  );
}
