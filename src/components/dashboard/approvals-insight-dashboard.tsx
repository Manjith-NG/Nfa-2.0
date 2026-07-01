"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DashboardKpiSection } from "@/components/dashboard/dashboard-shell";
import { cn } from "@/lib/utils";
import type { ApprovalsInsightCard } from "@/lib/services/approvals-insight-service";

const statStyles = {
  accepted: "hover:bg-green-50/80",
  pending: "hover:bg-orange-50/80",
  resend: "hover:bg-yellow-50/80",
  rejected: "hover:bg-red-50/80",
} as const;

function InsightCard({ card }: { card: ApprovalsInsightCard }) {
  const resendLabel = card.roleCode === "HOD" || card.roleCode === "COE" ? "Resend" : "Recheck";

  return (
    <article className="flex h-full flex-col rounded-xl border border-nfa-border bg-white p-4 shadow-card">
      <Link
        href={card.filterHref}
        className="mb-3 flex items-start justify-between gap-3 rounded-lg transition-colors hover:bg-slate-50/80"
      >
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-nfa-primary">{card.label}</h4>
          {card.flowSteps && card.flowSteps.length > 0 && (
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500" title={card.flowSteps.join(" → ")}>
              {card.flowSteps.join(" → ")}
            </p>
          )}
        </div>
        <span className="shrink-0 text-xl font-semibold tabular-nums text-slate-900 sm:text-2xl">
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
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg border border-transparent px-2 py-1.5 transition-colors",
        statStyles[tone]
      )}
    >
      <p className="text-lg font-semibold tabular-nums text-slate-900 sm:text-xl">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
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
            <span className="rounded-full border border-nfa-primary/25 bg-white px-3 py-1 text-xs font-medium text-nfa-primary shadow-sm">
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
