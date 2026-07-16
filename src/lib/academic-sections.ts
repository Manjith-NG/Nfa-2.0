import type { RoleCode } from "@prisma/client";
import { ROLE_LABELS } from "@/lib/constants";

export function getSectionLabel(section: { name: string; code?: string } | string | null | undefined): string {
  if (!section) return "";
  if (typeof section === "string") return section;
  return section.name;
}

export function routesToHod(entryRole: RoleCode): boolean {
  return entryRole === "HOD";
}

export function getAcademicSectionWorkflowRoles(entryRole: RoleCode): RoleCode[] {
  switch (entryRole) {
    case "HOD":
      return ["HOD", "IQAC", "PMSEB", "COE"];
    case "HR":
      return ["HR", "IQAC", "PMSEB", "COE"];
    case "COE":
      return ["COE", "IQAC", "PMSEB"];
    default:
      return ["IQAC", "PMSEB", "COE"];
  }
}

function stepLabelForRole(roleCode: RoleCode): string {
  if (roleCode === "OFC") return "Awaiting Final Clearance";
  if (roleCode === "REGISTRAR") return "Registrar Approval";
  if (roleCode === "CLUB_AUTHORITY") return "Club Authority Approval";
  return `${ROLE_LABELS[roleCode]} Approval`;
}

export function getAcademicWorkflowSteps(entryRole: RoleCode): {
  stepOrder: number;
  roleCode: RoleCode;
  stepLabel: string;
}[] {
  const middle = getAcademicSectionWorkflowRoles(entryRole);
  const roles: RoleCode[] = [...middle, "REGISTRAR", "OFC"];
  const unique: RoleCode[] = [];
  for (const role of roles) {
    if (!unique.includes(role)) unique.push(role);
  }

  return unique.map((roleCode, index) => ({
    stepOrder: index + 1,
    roleCode,
    stepLabel: stepLabelForRole(roleCode),
  }));
}
