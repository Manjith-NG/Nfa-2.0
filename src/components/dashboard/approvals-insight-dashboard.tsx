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
import { cn } from "@/lib/utils";
import type { ApprovalsInsightCard } from "@/lib/services/approvals-insight-service";

const PIPELINE_ROLES: RoleCode[] = ["IQAC", "PMSEB", "HR", "COE", "REGISTRAR", "OFC"];

/** Compact labels so queue cards stay readable in a responsive grid */
const SHORT_ROLE_LABELS: Partial<Record<RoleCode, string>> = {
  HOD: "HOD",
  CLUB_AUTHORITY: "Club Admin",
  IQAC: "IQAC",
  PMSEB: "PMSEB",
  HR: "HR",
  COE: "COE",
  REGISTRAR: "Registrar",
  OFC: "OFC",
};

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
  "grid w-full min-w-0 gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,14.5rem),1fr))]";

function shortRoleLabel(roleCode: RoleCode, fallback?: string): string {
  return SHORT_ROLE_LABELS[roleCode] ?? fallback ?? roleCode;
}

function cardTitle(card: ApprovalsInsightCard): string {
  if (card.roleCode === "HOD" || card.roleCode === "CLUB_AUTHORITY") {
    return card.label;
  }
  return shortRoleLabel(card.roleCode, card.label);
}

function resendLabel(roleCode: RoleCode): string {
  return roleCode === "HOD" || roleCode === "COE" ? "Resend" : "Recheck";
}

function flowCaption(card: ApprovalsInsightCard): string {
  if (!card.flowSteps?.length) return "";

  const idx = PIPELINE_ROLES.indexOf(card.roleCode);
  if (idx >= 0 && idx < PIPELINE_ROLES.length - 1) {
    return `${shortRoleLabel(card.roleCode)} → ${shortRoleLabel(PIPELINE_ROLES[idx + 1])}`;
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
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-nfa-primary">
      <Icon className="h-4 w-4" />
    </div>
  );
}

function RoleQueueCard({ card }: { card: ApprovalsInsightCard }) {
  const title = cardTitle(card);
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
    <article className="flex h-full min-w-0 max-w-full flex-col rounded-xl border border-nfa-border bg-white p-3.5 shadow-card sm:p-4">
      <Link
        href={card.filterHref}
        className="mb-3 flex min-w-0 items-start gap-2.5 transition-opacity hover:opacity-90"
        title={card.label}
      >
        <RoleIcon roleCode={card.roleCode} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="truncate text-sm font-bold leading-tight text-slate-900">{title}</h4>
            <span className="shrink-0 rounded-md bg-nfa-primary/10 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-nfa-primary">
              {card.total}
            </span>
          </div>
          {caption && (
            <p className="mt-0.5 truncate text-[11px] text-slate-500" title={caption}>
              {caption}
            </p>
          )}
        </div>
      </Link>

      <div className="min-w-0 space-y-1.5 border-t border-nfa-border pt-3">
        {rows.map((row) => (
          <Link
            key={row.label}
            href={row.href}
            className="flex min-w-0 items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-slate-50"
          >
            <span className={cn("h-2 w-2 shrink-0 rounded-full", row.dot)} />
            <span className="w-5 shrink-0 text-sm font-bold tabular-nums text-slate-900">
              {row.value}
            </span>
            <span className="truncate text-xs text-slate-500">{row.label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-auto flex items-center gap-2 pt-3">
        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-nfa-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-nfa-primary">
          {percent}%
        </span>
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

  return <CardGrid cards={allCards} />;
}

export function ApprovalsInsightSkeleton() {
  return (
    <div className={stageGridClass} aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-52 animate-pulse rounded-xl border border-nfa-border bg-slate-100"
        />
      ))}
    </div>
  );
}
