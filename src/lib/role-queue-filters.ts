import type { RequestCategory, RoleCode } from "@prisma/client";

export type StageOutcome = "accepted" | "pending" | "rejected" | "resend";

export type RoleQueueScope = {
  category?: RequestCategory;
  clubId?: string;
  academicSectionId?: string;
  departmentId?: string;
};

export const STAGE_OUTCOME_LABELS: Record<StageOutcome, string> = {
  accepted: "Accepted",
  pending: "Pending",
  rejected: "Rejected",
  resend: "Recheck",
};

export function stageOutcomeLabel(outcome: StageOutcome, roleCode?: RoleCode): string {
  if (outcome === "resend" && (roleCode === "HOD" || roleCode === "COE")) {
    return "Resend";
  }
  return STAGE_OUTCOME_LABELS[outcome];
}

export function buildRoleQueueFilterHref(
  roleCode: RoleCode,
  outcome?: StageOutcome,
  scope?: RoleQueueScope
): string {
  const params = new URLSearchParams({ role: roleCode });
  if (outcome) params.set("stage", outcome);
  if (scope?.category) params.set("category", scope.category);
  if (scope?.clubId) params.set("clubId", scope.clubId);
  if (scope?.academicSectionId) params.set("sectionId", scope.academicSectionId);
  if (scope?.departmentId) params.set("departmentId", scope.departmentId);
  return `/requests?${params.toString()}`;
}

export function parseStageOutcome(value?: string): StageOutcome | undefined {
  if (
    value === "accepted" ||
    value === "pending" ||
    value === "rejected" ||
    value === "resend"
  ) {
    return value;
  }
  return undefined;
}
