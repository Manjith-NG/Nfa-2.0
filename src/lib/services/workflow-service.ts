import { prisma } from "@/lib/db";
import type { SessionUser } from "@/types";
import type {
  RequestCategory,
  RoleCode,
  Prisma,
} from "@prisma/client";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit";
import {
  buildWorkflowPath,
  normalizeRoleSequence,
  parseWorkflowPath,
  resolveTemplateSteps,
  serializeWorkflowPath,
} from "@/lib/workflow/resolve";
import { getInitialStep } from "@/lib/workflow/engine";
import { notifyApprovers, notifyClubAuthority } from "@/lib/notifications";
import type { WorkflowPathStep } from "@/lib/workflow/types";

export async function listWorkflowTemplates(category?: RequestCategory) {
  return prisma.workflowTemplate.findMany({
    where: category ? { category, isActive: true } : { isActive: true },
    include: {
      requestType: { select: { id: true, code: true, name: true } },
      club: { select: { id: true, code: true, name: true } },
      academicSection: { select: { id: true, code: true, name: true } },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function createWorkflowTemplate(
  user: SessionUser,
  data: {
    name: string;
    category: RequestCategory;
    requestTypeId?: string;
    academicSectionId?: string;
    clubId?: string;
    steps: RoleCode[];
    isDefault?: boolean;
  }
) {
  if (!hasPermission(user, "flow:control")) {
    throw new Error("You do not have permission to manage workflow templates");
  }

  if (data.category === "ACADEMIC") {
    if (!data.academicSectionId && !data.isDefault) {
      throw new Error(
        "Select a specific academic section, or choose All sections and mark it as the default workflow"
      );
    }
  }

  if (data.category === "CLUB") {
    if (!data.clubId && !data.isDefault) {
      throw new Error(
        "Select a specific club, or choose All clubs and mark it as the default workflow"
      );
    }
  }

  if (data.isDefault) {
    await prisma.workflowTemplate.updateMany({
      where: {
        category: data.category,
        academicSectionId: data.academicSectionId ?? null,
        clubId: data.clubId ?? null,
        requestTypeId: data.requestTypeId ?? null,
        isDefault: true,
      },
      data: { isDefault: false },
    });
  }

  const template = await prisma.workflowTemplate.create({
    data: {
      name: data.name,
      category: data.category,
      requestTypeId: data.requestTypeId,
      academicSectionId: data.category === "ACADEMIC" ? data.academicSectionId : null,
      clubId: data.category === "CLUB" ? data.clubId : null,
      steps: normalizeRoleSequence(data.steps).filter((r) => r !== "OFC" && r !== "REGISTRAR"),
      isDefault: data.isDefault ?? false,
    },
  });

  await createAuditLog({
    userId: user.id,
    action: "WORKFLOW_TEMPLATE_CREATED",
    entityType: "WorkflowTemplate",
    entityId: template.id,
    newValue: data,
  });

  return template;
}

export async function updateWorkflowTemplate(
  user: SessionUser,
  id: string,
  data: {
    name?: string;
    steps?: RoleCode[];
    isDefault?: boolean;
    isActive?: boolean;
  }
) {
  if (!hasPermission(user, "flow:control")) {
    throw new Error("You do not have permission to manage workflow templates");
  }

  const existing = await prisma.workflowTemplate.findUniqueOrThrow({ where: { id } });

  if (data.isDefault) {
    await prisma.workflowTemplate.updateMany({
      where: {
        category: existing.category,
        academicSectionId: existing.academicSectionId,
        clubId: existing.clubId,
        requestTypeId: existing.requestTypeId,
        isDefault: true,
        NOT: { id },
      },
      data: { isDefault: false },
    });
  }

  const template = await prisma.workflowTemplate.update({
    where: { id },
    data: {
      name: data.name,
      isDefault: data.isDefault,
      isActive: data.isActive,
      ...(data.steps
        ? {
            steps: normalizeRoleSequence(data.steps).filter(
              (r) => r !== "OFC" && r !== "REGISTRAR"
            ),
          }
        : {}),
    },
  });

  await createAuditLog({
    userId: user.id,
    action: "WORKFLOW_TEMPLATE_UPDATED",
    entityType: "WorkflowTemplate",
    entityId: template.id,
    newValue: data,
  });

  return template;
}

export async function deleteWorkflowTemplate(user: SessionUser, id: string) {
  if (!hasPermission(user, "flow:control")) {
    throw new Error("You do not have permission to manage workflow templates");
  }

  const existing = await prisma.workflowTemplate.findUniqueOrThrow({ where: { id } });

  await prisma.workflowTemplate.delete({ where: { id } });

  await createAuditLog({
    userId: user.id,
    action: "WORKFLOW_TEMPLATE_DELETED",
    entityType: "WorkflowTemplate",
    entityId: id,
    oldValue: { name: existing.name, category: existing.category },
  });
}

export async function assignRequestWorkflow(
  user: SessionUser,
  requestId: string,
  roles: RoleCode[]
) {
  if (user.roleCode !== "REGISTRAR") {
    throw new Error("Only the Registrar can assign request workflows");
  }

  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Request not found");
  if (!["DRAFT", "PENDING", "RESEND"].includes(request.status)) {
    throw new Error("Workflow can only be changed before the request is fully in progress");
  }

  const workflowPath = buildWorkflowPath(roles);
  const initial = getInitialStep(workflowPath);

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: {
      workflowPath: serializeWorkflowPath(workflowPath) as unknown as Prisma.InputJsonValue,
      currentStep: request.status === "DRAFT" ? 0 : initial.step,
      currentRoleCode: request.status === "DRAFT" ? null : initial.roleCode,
      status: request.status === "DRAFT" ? "DRAFT" : "PENDING",
    },
  });

  if (request.status !== "DRAFT" && initial.roleCode) {
    const link = `/requests/${requestId}`;
    const message = `${request.requestNumber}: ${request.title}`;
    if (initial.roleCode === "HOD" && request.departmentId) {
      await notifyApprovers({
        roleCode: "HOD",
        departmentId: request.departmentId,
        title: "Request routed for HOD approval",
        message,
        link,
      });
    } else if (initial.roleCode === "CLUB_AUTHORITY" && request.clubId) {
      await notifyClubAuthority(request.clubId, {
        title: "Request routed for club approval",
        message,
        link,
      });
    } else {
      await notifyApprovers({
        roleCode: initial.roleCode,
        title: "Request routed for approval",
        message,
        link,
      });
    }
  }

  await createAuditLog({
    userId: user.id,
    action: "REQUEST_WORKFLOW_ASSIGNED",
    entityType: "Request",
    entityId: requestId,
    newValue: { roles, workflowPath: serializeWorkflowPath(workflowPath) } as unknown as Prisma.InputJsonValue,
  });

  return updated;
}

export async function forwardRequestToRole(
  user: SessionUser,
  requestId: string,
  targetRole: RoleCode
) {
  if (user.roleCode !== "REGISTRAR") {
    throw new Error("Only the Registrar can forward requests");
  }
  if (!["HR", "COE", "IQAC", "PMSEB"].includes(targetRole)) {
    throw new Error("Invalid forward target");
  }

  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Request not found");
  if (request.currentRoleCode !== "REGISTRAR") {
    throw new Error("Forward is available only when the request is with the Registrar");
  }

  const existingPath =
    parseWorkflowPath(request.workflowPath) ??
    (await resolveTemplateSteps({
      category: request.category,
      requestTypeId: request.requestTypeId,
      academicSectionId: request.academicSectionId,
    }));

  const registrarIndex = existingPath.findIndex((s) => s.roleCode === "REGISTRAR");
  const beforeRegistrar = existingPath
    .slice(0, registrarIndex >= 0 ? registrarIndex : existingPath.length)
    .map((s) => s.roleCode);
  const roles: RoleCode[] = [
    ...beforeRegistrar.filter((r) => r !== targetRole),
    targetRole,
    "REGISTRAR",
  ];
  const workflowPath = buildWorkflowPath(roles);
  const targetStep = workflowPath.find((s) => s.roleCode === targetRole);
  if (!targetStep) throw new Error("Unable to build forward path");

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: {
      workflowPath: serializeWorkflowPath(workflowPath) as unknown as Prisma.InputJsonValue,
      currentStep: targetStep.stepOrder,
      currentRoleCode: targetRole,
      status: "PENDING",
    },
  });

  await prisma.approvalHistory.create({
    data: {
      requestId,
      stepOrder: request.currentStep,
      roleCode: user.roleCode,
      action: "FORWARD",
      actorId: user.id,
      previousStatus: request.status,
      newStatus: "PENDING",
      remarks: `Forwarded to ${targetRole}`,
    },
  });

  await notifyApprovers({
    roleCode: targetRole,
    title: "Request forwarded for approval",
    message: `${request.requestNumber}: ${request.title}`,
    link: `/requests/${requestId}`,
  });

  await createAuditLog({
    userId: user.id,
    action: "REQUEST_FORWARDED",
    entityType: "Request",
    entityId: requestId,
    newValue: { targetRole, workflowPath: serializeWorkflowPath(workflowPath) } as unknown as Prisma.InputJsonValue,
  });

  return updated;
}

export function workflowPathFromRequest(request: {
  workflowPath?: Prisma.JsonValue | null;
  category: RequestCategory;
  academicSectionId?: string | null;
}): WorkflowPathStep[] | null {
  return parseWorkflowPath(request.workflowPath);
}
