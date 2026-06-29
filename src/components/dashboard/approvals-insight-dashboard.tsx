"use client";

import Link from "next/link";
import { ClipboardList, ChevronRight } from "lucide-react";
import type { ApprovalsInsightCard } from "@/lib/services/approvals-insight-service";

function InsightCard({ card }: { card: ApprovalsInsightCard }) {
  const resendLabel = card.roleCode === "HOD" || card.roleCode === "COE" ? "Resend" : "Recheck";

  return (
    <div className="nfa-card flex h-full min-h-[168px] flex-col p-5 transition-colors hover:border-orange-200">
      <Link
        href={card.filterHref}
        className="mb-3 flex items-start justify-between gap-2 rounded-md transition-colors hover:bg-orange-50/40"
      >
        <div className="min-w-0">
          <h4 className="text-sm font-bold uppercase tracking-wide text-orange-600">{card.label}</h4>
          {card.flowSteps && card.flowSteps.length > 0 && (
            <p className="mt-1 truncate text-[11px] text-slate-500" title={card.flowSteps.join(" → ")}>
              {card.flowSteps.join(" → ")}
            </p>
          )}
        </div>
        <span className="shrink-0 text-2xl font-bold text-orange-600">{card.total}</span>
      </Link>

      <div className="mt-auto grid flex-1 grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-3">
        <StatLink href={card.hrefAccepted} value={card.accepted} label="Accepted" />
        <StatLink href={card.hrefPending} value={card.pending} label="Pending" />
        <StatLink href={card.hrefResend} value={card.resend} label={resendLabel} />
        <StatLink href={card.hrefRejected} value={card.rejected} label="Rejected" />
      </div>
    </div>
  );
}

function StatLink({ href, value, label }: { href: string; value: number; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-md px-1 py-0.5 transition-colors hover:bg-orange-50/60"
    >
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </Link>
  );
}

function CardGrid({ cards }: { cards: ApprovalsInsightCard[] }) {
  if (cards.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
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
    <div className="nfa-card overflow-x-auto p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        University approval pipeline
      </p>
      <div className="flex min-w-max items-center gap-1">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center gap-1">
            <span className="rounded-full border border-nfa-primary/30 bg-nfa-primary/5 px-3 py-1 text-xs font-medium text-nfa-primary">
              {step}
            </span>
            {index < steps.length - 1 && (
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
            )}
          </div>
        ))}
      </div>
    </div>
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

  return (
    <section className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-nfa-primary" />
          <h3 className="text-lg font-semibold text-slate-900">Approvals by Role</h3>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Click a role or total to see all requests at that stage. Click Accepted, Pending, Recheck, or
          Rejected to filter by status.
        </p>
      </div>

      {allCards.length === 0 ? (
        <div className="nfa-card text-sm text-slate-500">
          No workflow templates configured yet. Set up flows in Sections &amp; Flow to see stage counts.
        </div>
      ) : (
        <div className="space-y-6">
          <PipelineFlowStrip pipelineCards={pipelineCards} />

          {entryCards.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Entry points (Academic &amp; Club)
              </h4>
              <CardGrid cards={entryCards} />
            </div>
          )}
          {pipelineCards.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Shared approval stages
              </h4>
              <CardGrid cards={pipelineCards} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function ApprovalsInsightSkeleton() {
  return (
    <section className="space-y-4">
      <div className="h-7 w-72 animate-pulse rounded bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="nfa-card h-[168px] animate-pulse bg-slate-100" />
        ))}
      </div>
    </section>
  );
}
