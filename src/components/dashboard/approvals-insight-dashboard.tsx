"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Users,
  ClipboardCheck,
  BarChart3,
  UserCog,
  GraduationCap,
  FileCheck,
  ShieldCheck,
} from "lucide-react";
import type { RoleCode } from "@prisma/client";
import { DashboardKpiSection } from "@/components/dashboard/dashboard-shell";
import { ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ApprovalsInsightCard } from "@/lib/services/approvals-insight-service";

const PIPELINE_ROLES: RoleCode[] = ["IQAC", "PMSEB", "HR", "COE", "REGISTRAR", "OFC"];

const roleIcons: Partial<Record<RoleCode, LucideIcon>> = {
  HOD: GraduationCap,
  CLUB_AUTHORITY: Users,
  IQAC: ClipboardCheck,
  PMSEB: BarChart3,
  HR: UserCog,
  COE: GraduationCap,
  REGISTRAR: FileCheck,
  OFC: ShieldCheck,
};

const stageGridClass =
  "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6";

function resendLabel(roleCode: RoleCode): string {
  return roleCode === "HOD" || roleCode === "COE" ? "Resend" : "Recheck";
}

function flowCaption(card: ApprovalsInsightCard): string {
  if (!card.flowSteps?.length) return "";

  const idx = PIPELINE_ROLES.indexOf(card.roleCode);
  if (idx >= 0 && idx < PIPELINE_ROLES.length - 1) {
    const current = ROLE_LABELS[card.roleCode] ?? card.label;
    const next = ROLE_LABELS[PIPELINE_ROLES[idx + 1]] ?? PIPELINE_ROLES[idx + 1];
    return `${current} → ${next}`;
  }

  if (card.flowSteps.length >= 2) {
    return `${card.flowSteps[0]} → ${card.flowSteps[1]}`;
  }

  return card.flowSteps[0] ?? "";
}

function completionPercent(card: ApprovalsInsightCard): number {
  if (card.total <= 0) return 0;
  return Math.round((card.accepted / card.total) * 100);
}

function RoleIcon({ roleCode }: { roleCode: RoleCode }) {
  const Icon = roleIcons[roleCode] ?? Building2;
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-nfa-primary">
      <Icon className="h-4 w-4" />
    </div>
  );
}

function RoleQueueCard({ card }: { card: ApprovalsInsightCard }) {
  const caption = flowCaption(card);
  const percent = completionPercent(card);
  const recheckLabel = resendLabel(card.roleCode);

  const rows = [
    { href: card.hrefAccepted, value: card.accepted, label: "Accepted", dot: "bg-green-500" },
    { href: card.hrefPending, value: card.pending, label: "Pending", dot: "bg-violet-500" },
    { href: card.hrefResend, value: card.resend, label: recheckLabel, dot: "bg-amber-500" },
    { href: card.hrefRejected, value: card.rejected, label: "Rejected", dot: "bg-red-500" },
  ] as const;

  return (
    <article className="flex h-full flex-col rounded-xl border border-nfa-border bg-white p-4 shadow-card">
      <Link
        href={card.filterHref}
        className="mb-3 flex items-start gap-2.5 transition-opacity hover:opacity-90"
      >
        <RoleIcon roleCode={card.roleCode} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-bold leading-tight text-slate-900">{card.label}</h4>
            <span className="shrink-0 text-sm font-bold tabular-nums text-nfa-primary">
              {card.total} Total
            </span>
          </div>
          {caption && (
            <p className="mt-0.5 truncate text-[11px] text-slate-500" title={caption}>
              {caption}
            </p>
          )}
        </div>
      </Link>

      <div className="space-y-2 border-t border-nfa-border pt-3">
        {rows.map((row) => (
          <Link
            key={row.label}
            href={row.href}
            className="flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-slate-50"
          >
            <span className={cn("h-2 w-2 shrink-0 rounded-full", row.dot)} />
            <span className="w-6 text-sm font-bold tabular-nums text-slate-900">{row.value}</span>
            <span className="text-xs text-slate-500">{row.label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-nfa-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-nfa-primary">{percent}%</span>
      </div>
    </article>
  );
}

function CardGrid({ cards }: { cards: ApprovalsInsightCard[] }) {
  if (cards.length === 0) return null;

  return (
    <div className={stageGridClass}>
      {cards.map((card) => (
        <RoleQueueCard key={card.key} card={card} />
      ))}
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

  if (allCards.length === 0) {
    return (
      <div className="rounded-xl border border-nfa-border bg-white p-6 text-sm text-slate-500 shadow-card">
        No workflow templates configured yet. Set up flows in Sections &amp; Flow to see stage counts.
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
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
    <div className="space-y-6 sm:space-y-8" aria-hidden="true">
      {[48, 52].map((width) => (
        <div key={width} className="space-y-3">
          <div className={cn("h-5 animate-pulse rounded bg-slate-200", width === 48 ? "w-48" : "w-52")} />
          <div className={stageGridClass}>
            {Array.from({ length: width === 48 ? 2 : 6 }).map((_, i) => (
              <div
                key={i}
                className="h-52 animate-pulse rounded-xl border border-nfa-border bg-slate-100"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
