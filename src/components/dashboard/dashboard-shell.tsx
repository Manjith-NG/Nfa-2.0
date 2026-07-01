import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types";

const kpiGridClasses = {
  4: "grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5",
} as const;

export type DashboardKpiColumns = keyof typeof kpiGridClasses;

export function DashboardWelcome({
  user,
  subtitle,
  actionHref,
  actionLabel,
}: {
  user: SessionUser;
  subtitle: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-nfa-border bg-gradient-to-br from-nfa-primary/[0.06] via-white to-nfa-accent/[0.04] px-4 py-4 shadow-sm sm:gap-4 sm:rounded-2xl sm:px-6 sm:py-5">
      <div className="min-w-0">
        <p className="text-xs font-medium text-nfa-primary sm:text-sm">Welcome back</p>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          {user.firstName} {user.lastName}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{subtitle}</p>
      </div>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="nfa-btn-primary shrink-0">
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function DashboardPageHeader({
  title,
  subtitle,
  actionHref,
  actionLabel,
}: {
  title: string;
  subtitle: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{subtitle}</p>
      </div>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="nfa-btn-primary shrink-0">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function DashboardKpiSection({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      {title && (
        <h3 className="text-sm font-bold tracking-tight text-slate-900">{title}</h3>
      )}
      {children}
    </section>
  );
}

export function DashboardSection({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="nfa-card overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-nfa-border px-4 py-3 sm:px-6 sm:py-4">
        <h3 className="text-sm font-semibold text-slate-900 sm:text-base">{title}</h3>
        {href && linkLabel && (
          <Link href={href} className="text-sm font-medium text-nfa-primary hover:underline">
            {linkLabel}
          </Link>
        )}
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

export function DashboardKpiGrid({
  items,
  columns = 5,
  className,
}: {
  items: {
    title: string;
    value: number;
    icon: LucideIcon;
    variant?: "default" | "pending" | "approved" | "rejected" | "resend";
    href?: string;
  }[];
  columns?: DashboardKpiColumns;
  className?: string;
}) {
  return (
    <div className={cn(kpiGridClasses[columns], className)}>
      {items.map((item) => (
        <KpiCard
          key={item.title}
          title={item.title}
          value={item.value}
          icon={item.icon}
          variant={item.variant}
          href={item.href}
        />
      ))}
    </div>
  );
}
