import type { RequestCategory, RoleCode } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getAcademicWorkflowSteps } from "@/lib/academic-sections";
import { getAcademicSectionById } from "@/lib/services/academic-section-service";
import { CLUB_WORKFLOW } from "@/lib/constants";
import { buildWorkflowPath, resolveTemplateSteps } from "@/lib/workflow/resolve";
import { fullName } from "@/lib/utils";

export type WorkflowAuthority = {
  roleCode: RoleCode;
  userId: string;
  name: string;
  email: string;
  departmentName?: string | null;
};

export type WorkflowPreviewStep = {
  stepOrder: number;
  roleCode: RoleCode;
  stepLabel: string;
};

export type WorkflowPreview = {
  steps: WorkflowPreviewStep[];
  authorities: WorkflowAuthority[];
};

function defaultClubSteps(): WorkflowPreviewStep[] {
  return CLUB_WORKFLOW.map((s) => ({
    stepOrder: s.stepOrder,
    roleCode: s.roleCode,
    stepLabel: s.stepLabel,
  }));
}

async function resolveSteps(params: {
  category: RequestCategory;
  academicSectionId?: string | null;
  clubId?: string | null;
}): Promise<WorkflowPreviewStep[]> {
  try {
    const steps = await resolveTemplateSteps(params);
    return steps.map((s) => ({
      stepOrder: s.stepOrder,
      roleCode: s.roleCode,
      stepLabel: s.stepLabel,
    }));
  } catch {
    if (params.category === "ACADEMIC" && params.academicSectionId) {
      const section = await getAcademicSectionById(params.academicSectionId);
      if (section) {
        return getAcademicWorkflowSteps(section.entryRole);
      }
    }
    if (params.category === "CLUB") {
      return defaultClubSteps();
    }
    return buildWorkflowPath(["IQAC", "PMSEB", "COE"]).map((s) => ({
      stepOrder: s.stepOrder,
      roleCode: s.roleCode,
      stepLabel: s.stepLabel,
    }));
  }
}

async function loadAuthoritiesForRoles(
  roleCodes: RoleCode[],
  options: { clubId?: string | null; departmentId?: string | null }
): Promise<WorkflowAuthority[]> {
  const authorities: WorkflowAuthority[] = [];
  const seen = new Set<string>();

  if (options.clubId && roleCodes.includes("CLUB_AUTHORITY")) {
    const clubAuth = await prisma.clubAuthority.findFirst({
      where: { clubId: options.clubId, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        },
      },
    });
    if (clubAuth) {
      authorities.push({
        roleCode: "CLUB_AUTHORITY",
        userId: clubAuth.user.id,
        name: fullName(clubAuth.user.firstName, clubAuth.user.lastName),
        email: clubAuth.user.email,
        departmentName: clubAuth.user.department?.name ?? null,
      });
      seen.add(clubAuth.user.id);
    }
  }

  if (options.departmentId && roleCodes.includes("HOD")) {
    const dept = await prisma.department.findUnique({
      where: { id: options.departmentId },
      include: {
        hod: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        },
      },
    });
    if (dept?.hod && !seen.has(dept.hod.id)) {
      authorities.push({
        roleCode: "HOD",
        userId: dept.hod.id,
        name: fullName(dept.hod.firstName, dept.hod.lastName),
        email: dept.hod.email,
        departmentName: dept.hod.department?.name ?? dept.name,
      });
      seen.add(dept.hod.id);
    }
  }

  const mappingRoles = roleCodes.filter(
    (r) => !["CLUB_AUTHORITY", "HOD", "FACULTY"].includes(r)
  );
  if (mappingRoles.length > 0) {
    const mappings = await prisma.authorityMapping.findMany({
      where: { roleCode: { in: mappingRoles }, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        },
      },
    });
    for (const mapping of mappings) {
      if (seen.has(mapping.user.id)) continue;
      seen.add(mapping.user.id);
      authorities.push({
        roleCode: mapping.roleCode,
        userId: mapping.user.id,
        name: fullName(mapping.user.firstName, mapping.user.lastName),
        email: mapping.user.email,
        departmentName: mapping.user.department?.name ?? null,
      });
    }
  }

  return authorities;
}

export async function getWorkflowPreview(params: {
  category: RequestCategory;
  academicSectionId?: string | null;
  clubId?: string | null;
  departmentId?: string | null;
}): Promise<WorkflowPreview> {
  const steps = await resolveSteps(params);
  const roleCodes = steps.map((s) => s.roleCode);
  const authorities = await loadAuthoritiesForRoles(roleCodes, {
    clubId: params.clubId,
    departmentId: params.departmentId,
  });
  return { steps, authorities };
}
