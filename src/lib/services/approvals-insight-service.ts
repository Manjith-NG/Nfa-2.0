import { cache } from "react";
import type {
  ApprovalAction,
  RequestCategory,
  RoleCode,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { ROLE_LABELS } from "@/lib/constants";
import { buildRoleQueueFilterHref } from "@/lib/role-queue-filters";
import { buildWorkflowPath } from "@/lib/workflow/resolve";

const PENDING_STATUSES = ["PENDING", "UNDER_REVIEW", "FORWARDED"] as const;
const PIPELINE_ROLES: RoleCode[] = ["IQAC", "PMSEB", "HR", "COE", "REGISTRAR", "OFC"];
const ENTRY_ROLES: RoleCode[] = ["HOD", "CLUB_AUTHORITY"];

export type ApprovalsInsightCard = {
  key: string;
  label: string;
  roleCode: RoleCode;
  total: number;
  accepted: number;
  pending: number;
  resend: number;
  rejected: number;
  filterHref: string;
  hrefAccepted: string;
  hrefPending: string;
  hrefResend: string;
  hrefRejected: string;
  flowSteps?: string[];
  departments?: { id: string; name: string; code: string; total: number }[];
};

type TemplateRecord = {
  id: string;
  name: string;
  category: RequestCategory;
  academicSectionId: string | null;
  clubId: string | null;
  requestTypeId: string | null;
  isDefault: boolean;
  steps: unknown;
  club?: { id: string; name: string } | null;
  academicSection?: { id: string; name: string; code: string } | null;
};

type RequestRecord = {
  id: string;
  departmentId: string;
  category: RequestCategory;
  academicSectionId: string | null;
  clubId: string | null;
  requestTypeId: string | null;
  workflowPath: unknown;
  currentRoleCode: RoleCode | null;
  status: string;
};

type StageCounts = {
  accepted: number;
  pending: number;
  resend: number;
  rejected: number;
  total: number;
};

function templateSteps(template: TemplateRecord): RoleCode[] {
  const roles = Array.isArray(template.steps)
    ? (template.steps as RoleCode[]).filter((r): r is RoleCode => typeof r === "string")
    : [];
  return buildWorkflowPath(roles).map((s) => s.roleCode);
}

function resolveTemplateForRequest(
  request: RequestRecord,
  templates: TemplateRecord[]
): TemplateRecord | null {
  const scoped = templates.filter((t) => t.category === request.category);
  if (scoped.length === 0) return null;

  return (
    (request.requestTypeId
      ? scoped.find((t) => t.requestTypeId === request.requestTypeId)
      : undefined) ??
    (request.clubId && request.category === "CLUB"
      ? scoped.find((t) => t.clubId === request.clubId && !t.requestTypeId)
      : undefined) ??
    (request.academicSectionId
      ? scoped.find(
          (t) =>
            t.academicSectionId === request.academicSectionId &&
            !t.requestTypeId &&
            !t.clubId
        )
      : undefined) ??
    scoped.find(
      (t) => t.isDefault && !t.academicSectionId && !t.clubId && !t.requestTypeId
    ) ??
    scoped.find((t) => !t.academicSectionId && !t.clubId && !t.requestTypeId) ??
    scoped[0]
  );
}

function shortFlowLabel(role: RoleCode): string {
  if (role === "CLUB_AUTHORITY") return "Club Auth.";
  if (role === "HOD") return "HOD";
  if (role === "HR") return "HR";
  if (role === "COE") return "COE";
  if (role === "OFC") return "OFC";
  return ROLE_LABELS[role] ?? role;
}

function flowCardLabel(
  template: TemplateRecord,
  firstRole: RoleCode,
  sectionName?: string | null
): string {
  if (template.club?.name) return template.club.name;
  if (firstRole === "HOD") return "HOD";
  if (firstRole === "HR") return "HR";
  if (firstRole === "COE") return "COE";
  if (firstRole === "CLUB_AUTHORITY") return "Club Admin";
  if (sectionName) return sectionName;
  return shortFlowLabel(firstRole);
}

function buildCardLinks(template: TemplateRecord, roleCode: RoleCode) {
  const scope = {
    category: template.category === "CLUB" ? ("CLUB" as const) : undefined,
    clubId: template.clubId ?? undefined,
    academicSectionId: template.academicSectionId ?? undefined,
  };

  return {
    filterHref: buildRoleQueueFilterHref(roleCode, undefined, scope),
    hrefAccepted: buildRoleQueueFilterHref(roleCode, "accepted", scope),
    hrefPending: buildRoleQueueFilterHref(roleCode, "pending", scope),
    hrefResend: buildRoleQueueFilterHref(roleCode, "resend", scope),
    hrefRejected: buildRoleQueueFilterHref(roleCode, "rejected", scope),
  };
}

function buildPipelineCardLinks(roleCode: RoleCode) {
  return {
    filterHref: buildRoleQueueFilterHref(roleCode),
    hrefAccepted: buildRoleQueueFilterHref(roleCode, "accepted"),
    hrefPending: buildRoleQueueFilterHref(roleCode, "pending"),
    hrefResend: buildRoleQueueFilterHref(roleCode, "resend"),
    hrefRejected: buildRoleQueueFilterHref(roleCode, "rejected"),
  };
}

function countStageForRole(
  roleCode: RoleCode,
  requestFilter: (request: RequestRecord) => boolean,
  requests: RequestRecord[],
  history: { requestId: string; roleCode: RoleCode; action: ApprovalAction }[]
): StageCounts {
  const scopedIds = new Set(requests.filter(requestFilter).map((r) => r.id));
  if (scopedIds.size === 0) {
    return { accepted: 0, pending: 0, resend: 0, rejected: 0, total: 0 };
  }

  const scopedHistory = history.filter((h) => scopedIds.has(h.requestId) && h.roleCode === roleCode);
  const accepted = new Set(
    scopedHistory.filter((h) => h.action === "APPROVE").map((h) => h.requestId)
  ).size;
  const rejected = new Set(
    scopedHistory.filter((h) => h.action === "REJECT").map((h) => h.requestId)
  ).size;

  const scopedRequests = requests.filter((r) => scopedIds.has(r.id));
  const pending = scopedRequests.filter(
    (r) =>
      r.currentRoleCode === roleCode &&
      PENDING_STATUSES.includes(r.status as (typeof PENDING_STATUSES)[number])
  ).length;

  const resend = scopedRequests.filter(
    (r) => r.currentRoleCode === roleCode && r.status === "RESEND"
  ).length;

  const total = accepted + pending + resend + rejected;

  return { accepted, pending, resend, rejected, total };
}

function countDepartmentsForRole(
  roleCode: RoleCode,
  requestFilter: (request: RequestRecord) => boolean,
  requests: RequestRecord[],
  history: { requestId: string; roleCode: RoleCode; action: ApprovalAction }[],
  departments: { id: string; name: string; code: string }[]
): { id: string; name: string; code: string; total: number }[] {
  return departments
    .map((dept) => {
      const stats = countStageForRole(
        roleCode,
        (r) => requestFilter(r) && r.departmentId === dept.id,
        requests,
        history
      );
      return { ...dept, total: stats.total };
    })
    .filter((d) => d.total > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function isHodFirstTemplate(template: TemplateRecord): boolean {
  const firstRole = templateSteps(template)[0];
  return Boolean(firstRole && firstRole === "HOD");
}

async function fetchApprovalsInsight(): Promise<{
  entryCards: ApprovalsInsightCard[];
  pipelineCards: ApprovalsInsightCard[];
}> {
  const [templates, requests, history, authorityRoles, departments] = await Promise.all([
    prisma.workflowTemplate.findMany({
      where: { isActive: true },
      include: { club: { select: { id: true, name: true } }, academicSection: { select: { id: true, name: true, code: true } } },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.request.findMany({
      where: { submittedAt: { not: null } },
      select: {
        id: true,
        departmentId: true,
        category: true,
        academicSectionId: true,
        clubId: true,
        requestTypeId: true,
        workflowPath: true,
        currentRoleCode: true,
        status: true,
      },
    }),
    prisma.approvalHistory.findMany({
      select: { requestId: true, roleCode: true, action: true },
    }),
    prisma.authorityMapping.findMany({
      where: { isActive: true, departmentId: null },
      select: { roleCode: true },
      distinct: ["roleCode"],
    }),
    prisma.department.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const requestTemplateMap = new Map<string, TemplateRecord>();
  for (const request of requests) {
    const template = resolveTemplateForRequest(request, templates);
    if (template) requestTemplateMap.set(request.id, template);
  }

  const entryCards: ApprovalsInsightCard[] = [];
  const seenEntryKeys = new Set<string>();
  let hodFlowSteps: string[] | undefined;

  for (const template of templates) {
    const steps = templateSteps(template);
    const firstRole = steps[0];
    if (!firstRole || !ENTRY_ROLES.includes(firstRole)) continue;

    // HOD entry cards are merged into a single university-wide card below.
    if (firstRole === "HOD") {
      hodFlowSteps = steps.map((role) => shortFlowLabel(role));
      continue;
    }

    const key = template.clubId
      ? `club-${template.clubId}`
      : template.academicSectionId
        ? `section-${template.academicSectionId}-${firstRole}`
        : `flow-${firstRole}-${template.id}`;

    if (seenEntryKeys.has(key)) continue;
    seenEntryKeys.add(key);

    const stats = countStageForRole(
      firstRole,
      (r) => requestTemplateMap.get(r.id)?.id === template.id,
      requests,
      history
    );

    entryCards.push({
      key,
      label: flowCardLabel(template, firstRole, template.academicSection?.name),
      roleCode: firstRole,
      ...stats,
      ...buildCardLinks(template, firstRole),
      flowSteps: steps.map((role) => shortFlowLabel(role)),
    });
  }

  const hasHodTemplates = templates.some(isHodFirstTemplate);
  if (hasHodTemplates) {
    const hodFilter = (r: RequestRecord) => {
      const template = requestTemplateMap.get(r.id);
      return Boolean(template && isHodFirstTemplate(template));
    };

    const hodStats = countStageForRole("HOD", hodFilter, requests, history);
    const hodLinks = buildPipelineCardLinks("HOD");

    entryCards.unshift({
      key: "entry-HOD",
      label: "HOD",
      roleCode: "HOD",
      ...hodStats,
      ...hodLinks,
      flowSteps: hodFlowSteps,
      departments: countDepartmentsForRole("HOD", hodFilter, requests, history, departments),
    });
  }

  const assignedPipelineRoles = new Set(
    authorityRoles.map((a) => a.roleCode).filter((r) => PIPELINE_ROLES.includes(r))
  );

  const activePipelineRoles = PIPELINE_ROLES.filter(
    (role) =>
      templates.some((t) => templateSteps(t).includes(role)) || assignedPipelineRoles.has(role)
  );

  const pipelineCards: ApprovalsInsightCard[] = activePipelineRoles.map((roleCode) => {
    const stats = countStageForRole(
      roleCode,
      () => true,
      requests,
      history
    );

    return {
      key: `pipeline-${roleCode}`,
      label: shortFlowLabel(roleCode),
      roleCode,
      ...stats,
      ...buildPipelineCardLinks(roleCode),
      flowSteps: activePipelineRoles.map((r) => shortFlowLabel(r)),
    };
  });

  return { entryCards, pipelineCards };
}

export const getApprovalsInsight = cache(fetchApprovalsInsight);
