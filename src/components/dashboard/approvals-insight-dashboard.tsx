"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DashboardKpiSection } from "@/components/dashboard/dashboard-shell";
import { cn } from "@/lib/utils";
import type { ApprovalsInsightCard } from "@/lib/services/approvals-insight-service";

function InsightCard({ card }: { card: ApprovalsInsightCard }) {
  const resendLabel = card.roleCode === "HOD" || card.roleCode === "COE" ? "Resend" : "Recheck";

  return (
    <article className="flex h-full flex-col rounded-xl border border-nfa-border bg-white shadow-card transition-shadow hover:shadow-card-hover">
      <Link
        href={card.filterHref}
        className="flex items-center justify-between gap-3 border-b border-nfa-border bg-slate-50/80 px-4 py-3 transition-colors hover:bg-slate-100/80"
      >
        <div className="min-w-0">
          <h4 className="truncate text-base font-bold tracking-tight text-slate-900">{card.label}</h4>
          {card.flowSteps && card.flowSteps.length > 0 && (
            <p
              className="mt-0.5 line-clamp-1 text-[11px] text-slate-500"
              title={card.flowSteps.join(" → ")}
            >
              {card.flowSteps.join(" → ")}
            </p>
          )}
        </div>
        <span className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg bg-nfa-primary px-2.5 text-base font-bold tabular-nums text-white sm:h-10 sm:min-w-10 sm:text-lg">
          {card.total}
        </span>
      </Link>

      <div className="grid grid-cols-2 gap-2 p-4 pt-3">
        <StatLink href={card.hrefAccepted} value={card.accepted} label="Accepted" />
        <StatLink href={card.hrefPending} value={card.pending} label="Pending" />
        <StatLink href={card.hrefResend} value={card.resend} label={resendLabel} />
        <StatLink href={card.hrefRejected} value={card.rejected} label="Rejected" />
      </div>
    </article>
  );
}

function StatLink({ href, value, label }: { href: string; value: number; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-nfa-border/70 bg-slate-50/50 px-2 py-1.5 transition-colors hover:border-nfa-primary/20 hover:bg-slate-50"
    >
      <p className="text-lg font-semibold tabular-nums text-slate-900 sm:text-xl">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
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
    <section className="rounded-xl border border-nfa-border bg-gradient-to-br from-nfa-primary/[0.06] via-white to-nfa-primary/[0.03] p-4 shadow-sm sm:p-5">
      <h3 className="mb-3 text-sm font-bold tracking-tight text-slate-900">
        University approval pipeline
      </h3>
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center gap-2">
            <span className="rounded-full border border-nfa-primary/30 bg-nfa-primary px-3 py-1 text-xs font-semibold text-white shadow-sm">
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
