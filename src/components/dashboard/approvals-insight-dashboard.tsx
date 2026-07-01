"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { RoleCode } from "@prisma/client";
import { DashboardKpiSection } from "@/components/dashboard/dashboard-shell";
import { cn } from "@/lib/utils";
import type { ApprovalsInsightCard } from "@/lib/services/approvals-insight-service";

const roleTheme: Record<
  RoleCode,
  { border: string; badge: string; total: string }
> = {
  FACULTY: {
    border: "border-l-slate-400",
    badge: "bg-slate-600 text-white",
    total: "bg-slate-700 text-white",
  },
  HOD: {
    border: "border-l-nfa-primary",
    badge: "bg-nfa-primary text-white",
    total: "bg-nfa-primary text-white",
  },
  CLUB_AUTHORITY: {
    border: "border-l-violet-500",
    badge: "bg-violet-600 text-white",
    total: "bg-violet-600 text-white",
  },
  IQAC: {
    border: "border-l-nfa-accent",
    badge: "bg-nfa-accent text-white",
    total: "bg-nfa-accent text-white",
  },
  PMSEB: {
    border: "border-l-indigo-500",
    badge: "bg-indigo-600 text-white",
    total: "bg-indigo-600 text-white",
  },
  HR: {
    border: "border-l-sky-600",
    badge: "bg-sky-600 text-white",
    total: "bg-sky-600 text-white",
  },
  COE: {
    border: "border-l-purple-600",
    badge: "bg-purple-600 text-white",
    total: "bg-purple-600 text-white",
  },
  REGISTRAR: {
    border: "border-l-slate-700",
    badge: "bg-slate-700 text-white",
    total: "bg-slate-700 text-white",
  },
  OFC: {
    border: "border-l-emerald-600",
    badge: "bg-emerald-600 text-white",
    total: "bg-emerald-600 text-white",
  },
  ADMIN: {
    border: "border-l-slate-500",
    badge: "bg-slate-600 text-white",
    total: "bg-slate-600 text-white",
  },
};

const statStyles = {
  accepted: {
    tile: "border-green-100 bg-green-50 hover:bg-green-100/80",
    value: "text-status-approved",
    label: "text-green-700",
  },
  pending: {
    tile: "border-orange-100 bg-orange-50 hover:bg-orange-100/80",
    value: "text-status-pending",
    label: "text-orange-700",
  },
  resend: {
    tile: "border-amber-100 bg-amber-50 hover:bg-amber-100/80",
    value: "text-status-resend",
    label: "text-amber-700",
  },
  rejected: {
    tile: "border-red-100 bg-red-50 hover:bg-red-100/80",
    value: "text-status-rejected",
    label: "text-red-700",
  },
} as const;

function InsightCard({ card }: { card: ApprovalsInsightCard }) {
  const resendLabel = card.roleCode === "HOD" || card.roleCode === "COE" ? "Resend" : "Recheck";
  const theme = roleTheme[card.roleCode] ?? roleTheme.HOD;

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-xl border border-nfa-border border-l-4 bg-white p-4 shadow-card",
        theme.border
      )}
    >
      <Link
        href={card.filterHref}
        className="mb-3 flex items-start justify-between gap-3 rounded-lg transition-opacity hover:opacity-90"
      >
        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "inline-flex max-w-full truncate rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide",
              theme.badge
            )}
          >
            {card.label}
          </span>
          {card.flowSteps && card.flowSteps.length > 0 && (
            <p
              className="mt-2 rounded-md border border-slate-100 bg-slate-50 px-2 py-1.5 text-[11px] leading-snug text-slate-600"
              title={card.flowSteps.join(" → ")}
            >
              {card.flowSteps.join(" → ")}
            </p>
          )}
        </div>
        <span
          className={cn(
            "flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl px-2 text-lg font-bold tabular-nums shadow-sm sm:h-11 sm:min-w-11 sm:text-xl",
            theme.total
          )}
        >
          {card.total}
        </span>
      </Link>

      <div className="mt-auto grid grid-cols-2 gap-2 border-t border-nfa-border pt-3">
        <StatLink href={card.hrefAccepted} value={card.accepted} label="Accepted" tone="accepted" />
        <StatLink href={card.hrefPending} value={card.pending} label="Pending" tone="pending" />
        <StatLink href={card.hrefResend} value={card.resend} label={resendLabel} tone="resend" />
        <StatLink href={card.hrefRejected} value={card.rejected} label="Rejected" tone="rejected" />
      </div>
    </article>
  );
}

function StatLink({
  href,
  value,
  label,
  tone,
}: {
  href: string;
  value: number;
  label: string;
  tone: keyof typeof statStyles;
}) {
  const styles = statStyles[tone];

  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg border px-2 py-1.5 transition-colors",
        styles.tile
      )}
    >
      <p className={cn("text-lg font-bold tabular-nums sm:text-xl", styles.value)}>{value}</p>
      <p className={cn("text-xs font-semibold", styles.label)}>{label}</p>
    </Link>
  );
}

function CardGrid({ cards }: { cards: ApprovalsInsightCard[] }) {
  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cards.map((card) => (
        <InsightCard key={card.key} card={card} />
      ))}
    </div>
  );
}

function PipelineFlowStrip({ pipelineCards }: { pipelineCards: ApprovalsInsightCard[] }) {
  const steps = pipelineCards[0]?.flowSteps;
  if (!steps?.length) return null;

  return (
    <section className="rounded-xl border border-nfa-border bg-gradient-to-br from-nfa-primary/[0.06] via-white to-nfa-accent/[0.04] p-4 shadow-sm sm:p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        University approval pipeline
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold shadow-sm",
                index === 0 && "bg-nfa-primary text-white",
                index === steps.length - 1 && index !== 0 && "bg-emerald-600 text-white",
                index > 0 && index < steps.length - 1 && "border border-nfa-accent/30 bg-teal-50 text-nfa-accent"
              )}
            >
              {step}
            </span>
            {index < steps.length - 1 && (
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function ApprovalsInsightDashboard({
  entryCards,
  pipelineCards,
}: {
  entryCards: ApprovalsInsightCard[];
  pipelineCards: ApprovalsInsightCard[];
}) {
  const allCards = [...entryCards, ...pipelineCards];

  if (allCards.length === 0) {
    return (
      <div className="rounded-xl border border-nfa-border bg-white p-6 text-sm text-slate-500 shadow-card">
        No workflow templates configured yet. Set up flows in Sections &amp; Flow to see stage counts.
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {pipelineCards.length > 0 && <PipelineFlowStrip pipelineCards={pipelineCards} />}

      {entryCards.length > 0 && (
        <DashboardKpiSection title="Entry points (Academic & Club)">
          <CardGrid cards={entryCards} />
        </DashboardKpiSection>
      )}

      {pipelineCards.length > 0 && (
        <DashboardKpiSection title="Shared approval stages">
          <CardGrid cards={pipelineCards} />
        </DashboardKpiSection>
      )}
    </div>
  );
}

export function ApprovalsInsightSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6" aria-hidden="true">
      <div className="h-20 animate-pulse rounded-xl bg-slate-200/80" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl border border-nfa-border bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
