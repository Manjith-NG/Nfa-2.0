"use client";

import { ChevronRight } from "lucide-react";
import { ROLE_LABELS } from "@/lib/constants";
import type { RoleCode } from "@prisma/client";
import { cn } from "@/lib/utils";

export type WorkflowPreviewStep = {
  stepOrder: number;
  roleCode: RoleCode;
  stepLabel: string;
};

export type WorkflowAuthority = {
  roleCode: RoleCode;
  userId: string;
  name: string;
  email: string;
  departmentName?: string | null;
};

function shortLabel(step: WorkflowPreviewStep): string {
  if (step.roleCode === "OFC") return "OFC";
  if (step.roleCode === "CLUB_AUTHORITY") return "Club Auth.";
  return ROLE_LABELS[step.roleCode]?.split(" ")[0] ?? step.roleCode;
}

export function WorkflowPathPreview({
  steps,
  authorities = [],
  onAuthorityClick,
  compact = false,
  className,
}: {
  steps: WorkflowPreviewStep[];
  authorities?: WorkflowAuthority[];
  onAuthorityClick?: (userId: string) => void;
  compact?: boolean;
  className?: string;
}) {
  if (steps.length === 0) return null;

  const authorityByRole = new Map(authorities.map((a) => [a.roleCode, a]));

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-medium text-slate-500">Approval flow</p>
      <div className="flex flex-wrap items-center gap-1">
        {steps.map((step, index) => (
          <div key={`${step.roleCode}-${step.stepOrder}`} className="flex items-center gap-1">
            <span
              className={cn(
                "rounded-md border border-teal-200 bg-teal-50 font-medium text-teal-800",
                compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
              )}
              title={step.stepLabel}
            >
              {shortLabel(step)}
            </span>
            {index < steps.length - 1 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
            )}
          </div>
        ))}
      </div>

      {authorities.length > 0 && (
        <ul className="space-y-1 border-t border-nfa-border pt-2">
          {steps.map((step) => {
            const authority = authorityByRole.get(step.roleCode);
            if (!authority) return null;
            return (
              <li key={authority.userId} className="text-xs text-slate-600">
                <span className="text-slate-500">{shortLabel(step)}:</span>{" "}
                {onAuthorityClick ? (
                  <button
                    type="button"
                    className="font-medium text-nfa-primary hover:underline"
                    onClick={() => onAuthorityClick(authority.userId)}
                  >
                    {authority.name}
                  </button>
                ) : (
                  <span className="font-medium text-slate-800">{authority.name}</span>
                )}
                {authority.departmentName && (
                  <span className="text-slate-400"> · {authority.departmentName}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
