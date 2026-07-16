import { cn } from "@/lib/utils";
import type { RequestStatus, RoleCode } from "@prisma/client";
import { AWAITING_FINAL_CLEARANCE, STATUS_CONFIG } from "@/lib/constants";
import { isAwaitingFinalClearance } from "@/lib/workflow/engine";

export function StatusBadge({
  status,
  currentRoleCode,
  className,
}: {
  status: RequestStatus;
  currentRoleCode?: RoleCode | null;
  className?: string;
}) {
  const config = isAwaitingFinalClearance(status, currentRoleCode ?? null)
    ? AWAITING_FINAL_CLEARANCE
    : STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.bgClass,
        config.textClass,
        className
      )}
    >
      {config.label}
    </span>
  );
}
