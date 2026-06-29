import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, XCircle, Clock } from "lucide-react";
import { ROLE_LABELS } from "@/lib/constants";
import type { RoleCode } from "@prisma/client";

interface TimelineStep {
  stepOrder: number;
  roleCode: RoleCode | null;
  stepLabel: string;
  status: "completed" | "current" | "pending" | "rejected" | "skipped";
  actorName?: string;
  remarks?: string;
  completedAt?: string;
  hideRoleLabel?: boolean;
}

export function ApprovalTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="relative space-y-0">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const Icon =
          step.status === "completed"
            ? CheckCircle2
            : step.status === "rejected"
              ? XCircle
              : step.status === "current"
                ? Clock
                : Circle;

        return (
          <div key={`${step.stepOrder}-${step.stepLabel}`} className="relative flex gap-4 pb-8">
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
                step.status === "current" && "border-blue-500 text-blue-600",
                step.status === "rejected" && "border-red-500 text-red-600",
                step.status === "pending" && "border-slate-200 text-slate-400"
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 pt-0.5">
              <p className="font-medium text-slate-900">{step.stepLabel}</p>
              {!step.hideRoleLabel && step.roleCode && (
                <p className="text-sm text-slate-500">
                  {ROLE_LABELS[step.roleCode]}
                  {step.actorName && ` · ${step.actorName}`}
                </p>
              )}
              {step.remarks && (
                <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  {step.remarks}
                </p>
              )}
              {step.completedAt && (
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(step.completedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
