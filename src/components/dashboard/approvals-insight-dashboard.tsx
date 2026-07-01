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
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
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

const statusTiles = {
  accepted: {
    bg: "bg-green-50 hover:bg-green-100/80",
    border: "border-green-100",
    icon: CheckCircle2,
    iconClass: "text-green-600",
    labelClass: "text-green-700",
  },
  pending: {
    bg: "bg-violet-50 hover:bg-violet-100/80",
    border: "border-violet-100",
    icon: Clock,
    iconClass: "text-violet-600",
    labelClass: "text-violet-700",
  },
  resend: {
    bg: "bg-amber-50 hover:bg-amber-100/80",
    border: "border-amber-100",
    icon: RotateCcw,
    iconClass: "text-amber-600",
    labelClass: "text-amber-700",
  },
  rejected: {
    bg: "bg-red-50 hover:bg-red-100/80",
    border: "border-red-100",
    icon: XCircle,
    iconClass: "text-red-600",
    labelClass: "text-red-700",
  },
} as const;

function flowCaption(card: ApprovalsInsightCard, compact = false): string {
  if (card.flowSteps?.length) {
    if (compact) {
      const idx = PIPELINE_ROLES.indexOf(card.roleCode);
      if (idx >= 0 && idx < PIPELINE_ROLES.length - 1) {
        const current = ROLE_LABELS[card.roleCode] ?? card.label;
        const next = ROLE_LABELS[PIPELINE_ROLES[idx + 1]] ?? PIPELINE_ROLES[idx + 1];
        return `${current} → ${next}`;
      }
    }
    return card.flowSteps.join(" → ");
  }
  return "";
}

function completionPercent(card: ApprovalsInsightCard): number {
  if (card.total <= 0) return 0;
  return Math.round((card.accepted / card.total) * 100);
}

function TotalBadge({ total }: { total: number }) {
  return (
    <span className="shrink-0 rounded-full bg-nfa-primary px-3 py-1 text-sm font-bold tabular-nums text-white">
      {total} Total
    </span>
  );
}

function RoleIcon({ roleCode, large = false }: { roleCode: RoleCode; large?: boolean }) {
  const Icon = roleIcons[roleCode] ?? Building2;
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-slate-100 text-nfa-primary",
        large ? "h-12 w-12" : "h-9 w-9"
      )}
    >
      <Icon className={large ? "h-6 w-6" : "h-4 w-4"} />
    </div>
  );
}

function EntryPointCard({ card }: { card: ApprovalsInsightCard }) {
  const resendLabel = card.roleCode === "HOD" || card.roleCode === "COE" ? "Resend" : "Recheck";
  const caption = flowCaption(card);

  return (
    <article className="overflow-hidden rounded-xl border border-nfa-border bg-white shadow-card">
      <Link
        href={card.filterHref}
        className="flex items-center gap-3 border-b border-nfa-border px-4 py-4 transition-colors hover:bg-slate-50/80 sm:px-5"
      >
        <RoleIcon roleCode={card.roleCode} large />
        <div className="min-w-0 flex-1">
          <h4 className="text-lg font-bold text-slate-900">{card.label}</h4>
          {caption && (
            <p className="mt-0.5 truncate text-xs text-slate-500" title={caption}>
              {caption}
            </p>
          )}
        </div>
        <TotalBadge total={card.total} />
      </Link>

      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 sm:p-4">
        <StatusTile href={card.hrefAccepted} value={card.accepted} label="Accepted" tone="accepted" />
        <StatusTile href={card.hrefPending} value={card.pending} label="Pending" tone="pending" />
        <StatusTile href={card.hrefResend} value={card.resend} label={resendLabel} tone="resend" />
        <StatusTile href={card.hrefRejected} value={card.rejected} label="Rejected" tone="rejected" />
      </div>
    </article>
  );
}

function StatusTile({
  href,
  value,
  label,
  tone,
}: {
  href: string;
  value: number;
  label: string;
  tone: keyof typeof statusTiles;
}) {
  const styles = statusTiles[tone];
  const Icon = styles.icon;

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border px-2 py-3 text-center transition-colors",
        styles.bg,
        styles.border
      )}
    >
      <Icon className={cn("mb-1 h-4 w-4", styles.iconClass)} />
      <p className="text-xl font-bold tabular-nums text-slate-900">{value}</p>
      <p className={cn("mt-0.5 text-xs font-medium", styles.labelClass)}>{label}</p>
    </Link>
  );
}

function PipelineStageCard({ card }: { card: ApprovalsInsightCard }) {
  const resendLabel = card.roleCode === "HOD" || card.roleCode === "COE" ? "Resend" : "Recheck";
  const caption = flowCaption(card, true);
  const percent = completionPercent(card);

  const rows = [
    { href: card.hrefAccepted, value: card.accepted, label: "Accepted", dot: "bg-green-500" },
    { href: card.hrefPending, value: card.pending, label: "Pending", dot: "bg-violet-500" },
    { href: card.hrefResend, value: card.resend, label: resendLabel, dot: "bg-amber-500" },
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
          <div className="grid gap-4 lg:grid-cols-2">
            {entryCards.map((card) => (
              <EntryPointCard key={card.key} card={card} />
            ))}
          </div>
        </DashboardKpiSection>
      )}

      {pipelineCards.length > 0 && (
        <DashboardKpiSection title="Shared approval stages">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {pipelineCards.map((card) => (
              <PipelineStageCard key={card.key} card={card} />
            ))}
          </div>
        </DashboardKpiSection>
      )}
    </div>
  );
}

export function ApprovalsInsightSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8" aria-hidden="true">
      <div className="space-y-3">
        <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-40 animate-pulse rounded-xl border border-nfa-border bg-slate-100" />
          <div className="h-40 animate-pulse rounded-xl border border-nfa-border bg-slate-100" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-5 w-52 animate-pulse rounded bg-slate-200" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-xl border border-nfa-border bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
