import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import type { SessionUser } from "@/types";

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
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-nfa-border bg-gradient-to-br from-nfa-primary/[0.06] via-white to-nfa-accent/[0.04] px-6 py-5 shadow-sm">
      <div>
        <p className="text-sm font-medium text-nfa-primary">Welcome back</p>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          {user.firstName} {user.lastName}
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
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
      <div className="flex items-center justify-between border-b border-nfa-border px-6 py-4">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {href && linkLabel && (
          <Link href={href} className="text-sm font-medium text-nfa-primary hover:underline">
            {linkLabel}
          </Link>
        )}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export function DashboardKpiGrid({
  items,
}: {
  items: {
    title: string;
    value: number;
    icon: LucideIcon;
    variant?: "default" | "pending" | "approved" | "rejected" | "resend";
  }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.title}
            className="nfa-card flex items-center justify-between gap-3 py-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-500">{item.title}</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">
                {item.value}
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-nfa-primary/10 text-nfa-primary">
              <Icon className="h-5 w-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
