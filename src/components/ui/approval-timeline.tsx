import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, XCircle, Clock, RotateCcw } from "lucide-react";
import { ROLE_LABELS } from "@/lib/constants";
import {
  formatTrackingDate,
  formatTrackingTime,
} from "@/lib/workflow/timeline-labels";
import type { RoleCode } from "@prisma/client";

interface TimelineStep {
  stepOrder: number;
  roleCode: RoleCode | null;
  stepLabel: string;
  status: "completed" | "current" | "pending" | "rejected" | "skipped";
  actorName?: string;
  trackingStatus?: string;
  displayRemarks?: string;
  completedAt?: string;
  hideRoleLabel?: boolean;
}

export function ApprovalTimeline({
  steps,
  requestNumber,
}: {
  steps: TimelineStep[];
  requestNumber?: string;
}) {
  return (
    <div className="space-y-4">
      {requestNumber && (
        <div className="rounded-lg border border-orange-200 bg-orange-50/60 px-4 py-2.5">
          <p className="text-sm font-semibold text-orange-900">
            Reference ID: <span className="font-mono">{requestNumber}</span>
          </p>
        </div>
      )}

      <div className="relative space-y-0">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const isResend =
            step.trackingStatus === "Resend" || step.trackingStatus === "Recheck";
          const Icon =
            step.status === "completed"
              ? CheckCircle2
              : step.status === "rejected"
                ? XCircle
                : isResend
                  ? RotateCcw
                  : step.status === "current"
                    ? Clock
                    : Circle;

          const roleLabel = step.hideRoleLabel
            ? step.stepLabel
            : step.roleCode
              ? (ROLE_LABELS[step.roleCode] ?? step.stepLabel)
              : step.stepLabel;

          return (
            <div key={`${step.stepOrder}-${step.stepLabel}`} className="relative flex gap-4 pb-6">
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-[15px] top-8 h-full w-0.5",
                    step.status === "completed" ? "bg-emerald-300" : "bg-slate-200"
                  )}
                />
              )}
              <div
                className={cn(
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-white",
                  step.status === "completed" && "border-emerald-500 text-emerald-600",
                  step.status === "current" && "border-orange-500 text-orange-600",
                  step.status === "rejected" && "border-red-500 text-red-600",
                  step.status === "pending" && "border-slate-200 text-slate-400"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>

              <div className="flex min-w-0 flex-1 items-start justify-between gap-3 pt-0.5">
                <div className="min-w-0">
                  <p className="text-sm font-bold uppercase tracking-wide text-orange-700">
                    {roleLabel}
                  </p>
                  {step.completedAt && (
                    <p className="text-xs text-slate-500">{formatTrackingDate(step.completedAt)}</p>
                  )}
                  {step.displayRemarks && (
                    <p className="mt-1 text-xs text-slate-600">{step.displayRemarks}</p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  {step.trackingStatus && (
                    <span className="inline-block rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold uppercase text-slate-700">
                      {step.trackingStatus}
                    </span>
                  )}
                  {step.completedAt && (
                    <p className="mt-1 text-xs text-slate-400">
                      {formatTrackingTime(step.completedAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
