import type {
  RequestCategory,
  RoleCode,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { ROLE_LABELS } from "@/lib/constants";
import type { WorkflowPathJson, WorkflowPathStep } from "@/lib/workflow/types";

/** Roles the Registrar can add, remove, or reorder in Flow Control */
export const CONFIGURABLE_WORKFLOW_ROLES: RoleCode[] = [
  "HOD",
  "CLUB_AUTHORITY",
  "IQAC",
  "PMSEB",
  "HR",
  "COE",
  "REGISTRAR",
];

const TERMINAL_ROLES: RoleCode[] = ["REGISTRAR", "OFC"];

export function stepLabelForRole(roleCode: RoleCode): string {
  if (roleCode === "OFC") return "Awaiting Final Clearance";
  if (roleCode === "REGISTRAR") return "Registrar Approval";
  if (roleCode === "CLUB_AUTHORITY") return "Club Authority Approval";
  return `${ROLE_LABELS[roleCode]} Approval`;
}

export function normalizeRoleSequence(roles: RoleCode[]): RoleCode[] {
  const seen = new Set<RoleCode>();
  const middle: RoleCode[] = [];

  for (const role of roles) {
    if (TERMINAL_ROLES.includes(role) || seen.has(role)) continue;
    seen.add(role);
    middle.push(role);
  }

  return [...middle, "REGISTRAR", "OFC"];
}

export function buildWorkflowPath(roles: RoleCode[]): WorkflowPathStep[] {
  return normalizeRoleSequence(roles).map((roleCode, index) => ({
    stepOrder: index + 1,
    roleCode,
    stepLabel: stepLabelForRole(roleCode),
  }));
}

export function parseWorkflowPath(value: Prisma.JsonValue | null | undefined): WorkflowPathStep[] | null {
  if (!value || !Array.isArray(value)) return null;
  const steps = value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const roleCode = record.roleCode as RoleCode | undefined;
      if (!roleCode) return null;
      return {
        stepOrder: typeof record.stepOrder === "number" ? record.stepOrder : index + 1,
        roleCode,
        stepLabel:
          typeof record.stepLabel === "string"
            ? record.stepLabel
            : stepLabelForRole(roleCode),
      };
    })
    .filter((step): step is WorkflowPathStep => step !== null);

  return steps.length > 0 ? steps : null;
}

/** True when the stored workflow starts with HOD (department faculty entry flow). */
export function isHodEntryWorkflowPath(
  workflowPath: Prisma.JsonValue | null | undefined
): boolean {
  const steps = parseWorkflowPath(workflowPath);
  return steps?.[0]?.roleCode === "HOD";
}

export function serializeWorkflowPath(steps: WorkflowPathStep[]): WorkflowPathJson {
  return steps.map((step, index) => ({
    stepOrder: index + 1,
    roleCode: step.roleCode,
    stepLabel: step.stepLabel,
  }));
}

function noWorkflowConfiguredError(params: {
  category: RequestCategory;
  academicSectionId?: string | null;
  requestTypeId?: string | null;
  clubId?: string | null;
}): Error {
  const parts: string[] = [params.category];
  if (params.academicSectionId) parts.push("academic section");
  if (params.clubId) parts.push("club");
  if (params.requestTypeId) parts.push("request type");
  return new Error(
    `No approval workflow is configured for ${parts.join(" / ")}. Create one in Flow Control before submitting requests.`
  );
}

export async function resolveTemplateSteps(params: {
  category: RequestCategory;
  requestTypeId?: string | null;
  academicSectionId?: string | null;
  clubId?: string | null;
}): Promise<WorkflowPathStep[]> {
  const { category, requestTypeId, academicSectionId, clubId } = params;

  const active = await prisma.workflowTemplate.findMany({
    where: { category, isActive: true },
    orderBy: [{ updatedAt: "desc" }],
  });

  const template =
    (requestTypeId
      ? active.find((t) => t.requestTypeId === requestTypeId)
      : undefined) ??
    (clubId && category === "CLUB"
      ? active.find((t) => t.clubId === clubId && !t.requestTypeId)
      : undefined) ??
    (academicSectionId
      ? active.find(
          (t) => t.academicSectionId === academicSectionId && !t.requestTypeId && !t.clubId
        )
      : undefined) ??
    active.find((t) => t.isDefault && !t.academicSectionId && !t.clubId && !t.requestTypeId) ??
    active.find((t) => t.isDefault) ??
    (!requestTypeId && !academicSectionId && !clubId ? active[0] : undefined);

  if (!template) {
    throw noWorkflowConfiguredError(params);
  }

  const roles = Array.isArray(template.steps)
    ? (template.steps as RoleCode[]).filter((r): r is RoleCode => typeof r === "string")
    : [];

  if (roles.length === 0) {
    throw noWorkflowConfiguredError(params);
  }

  return buildWorkflowPath(roles);
}

export async function getWorkflowStepsForRequest(request: {
  category: RequestCategory;
  requestTypeId?: string | null;
  academicSectionId?: string | null;
  clubId?: string | null;
  workflowPath?: Prisma.JsonValue | null;
}): Promise<WorkflowPathStep[]> {
  const stored = parseWorkflowPath(request.workflowPath);
  if (stored) return stored;
  return resolveTemplateSteps({
    category: request.category,
    requestTypeId: request.requestTypeId,
    academicSectionId: request.academicSectionId,
    clubId: request.clubId,
  });
}

export async function resolveWorkflowForNewRequest(params: {
  category: RequestCategory;
  requestTypeId?: string | null;
  academicSectionId?: string | null;
  clubId?: string | null;
  workflowPath?: Prisma.JsonValue | null;
}): Promise<WorkflowPathStep[]> {
  const stored = parseWorkflowPath(params.workflowPath);
  if (stored) return stored;
  return resolveTemplateSteps(params);
}
