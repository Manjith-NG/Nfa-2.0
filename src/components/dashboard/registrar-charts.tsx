"use client";

import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Bone } from "@/components/ui/page-skeleton";
import type { DashboardAnalytics } from "@/lib/services/dashboard-service";

const CHART_COLORS = ["#1e3a5f", "#0d9488", "#ea580c", "#16a34a", "#dc2626", "#7c3aed"];

export function RegistrarCharts({ analytics }: { analytics: DashboardAnalytics }) {
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="nfa-card">
          <h3 className="mb-4 font-semibold">Requests by Academic Section</h3>
          <div className="h-64">
            {analytics.sectionBreakdown.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-slate-500">
                No academic requests yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.sectionBreakdown} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="section" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="nfa-card">
          <h3 className="mb-4 font-semibold">Requests by Club</h3>
          <div className="h-64">
            {analytics.clubBreakdown.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-slate-500">
                No club requests yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.clubBreakdown} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="club" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="nfa-card">
          <h3 className="mb-4 font-semibold">Academic vs Club</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.categoryBreakdown}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {analytics.categoryBreakdown.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="nfa-card">
          <h3 className="mb-1 font-semibold">Section & club totals</h3>
          <p className="mb-3 text-xs text-slate-500">Submitted requests only</p>
          <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
            {analytics.sectionBreakdown.map((row) => (
              <div key={row.section} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{row.section}</span>
                <span className="font-semibold tabular-nums text-nfa-primary">{row.count}</span>
              </div>
            ))}
            {analytics.clubBreakdown.length > 0 && (
              <div className="border-t border-nfa-border pt-2">
                {analytics.clubBreakdown.map((row) => (
                  <div key={row.club} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{row.club}</span>
                    <span className="font-semibold tabular-nums text-violet-700">{row.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="nfa-card">
          <h3 className="mb-4 font-semibold">Department Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.departmentPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="nfa-card">
          <h3 className="mb-4 font-semibold">Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.statusBreakdown}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {analytics.statusBreakdown.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="nfa-card lg:col-span-2">
          <h3 className="mb-4 font-semibold">Monthly Request Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="nfa-card">
        <h3 className="mb-4 font-semibold">Approval Funnel</h3>
        <div className="flex flex-wrap gap-6">
          {[
            { label: "Submitted", value: analytics.funnel.submitted, href: "/requests" },
            { label: "Pending", value: analytics.funnel.pending, href: "/requests?pending=1" },
            { label: "Completed", value: analytics.funnel.completed, href: "/requests?status=COMPLETED" },
            { label: "Rejected", value: analytics.funnel.rejected, href: "/requests?status=REJECTED" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-xl px-4 py-2 text-center transition-colors hover:bg-slate-50"
            >
              <p className="text-2xl font-bold text-nfa-primary">{item.value}</p>
              <p className="text-sm text-slate-500">{item.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

export function RegistrarChartsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Bone className="h-72 rounded-xl" />
      <Bone className="h-72 rounded-xl" />
      <Bone className="h-72 rounded-xl lg:col-span-2" />
    </div>
  );
}
