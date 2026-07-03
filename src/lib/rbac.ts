import type { RoleCode, RequestCategory, Prisma } from "@prisma/client";
import type { SessionUser } from "@/types";
import { SUPER_ADMIN_ROLES, APPROVAL_ROLES, DEVELOPER_DEMO_EMAIL } from "./constants";
import { parseWorkflowPath } from "@/lib/workflow/resolve";

export type Permission =
  | "request:create"
  | "request:view_own"
  | "request:view_department"
  | "request:view_all"
  | "request:approve"
  | "request:reject"
  | "request:resend"
  | "analytics:view"
  | "authorities:manage"
  | "flow:control"
  | "clubs:manage"
  | "audit:view"
  | "users:manage"
  | "reports:view";

const ROLE_PERMISSIONS: Record<RoleCode, Permission[]> = {
  FACULTY: ["request:create", "request:view_own"],
  HOD: [
    "request:create",
    "request:view_own",
    "request:view_department",
    "request:approve",
    "request:reject",
    "request:resend",
  ],
  CLUB_AUTHORITY: [
    "request:approve",
    "request:reject",
    "request:resend",
    "request:view_department",
  ],
  IQAC: [
    "request:create",
    "request:view_own",
    "request:approve",
    "request:reject",
    "request:resend",
    "request:view_all",
  ],
  PMSEB: [
    "request:create",
    "request:view_own",
    "request:approve",
    "request:reject",
    "request:resend",
    "request:view_all",
  ],
  HR: [
    "request:approve",
    "request:reject",
    "request:resend",
    "request:view_all",
  ],
  COE: [
    "request:create",
    "request:view_own",
    "request:approve",
    "request:reject",
    "request:resend",
    "request:view_all",
  ],
  REGISTRAR: [
    "request:view_own",
    "users:manage",
    "request:approve",
    "request:reject",
    "request:resend",
    "request:view_all",
    "analytics:view",
    "authorities:manage",
    "flow:control",
    "clubs:manage",
    "audit:view",
    "reports:view",
  ],
  OFC: [
    "request:view_own",
    "users:manage",
    "request:approve",
    "request:reject",
    "request:resend",
    "request:view_all",
    "analytics:view",
    "authorities:manage",
    "flow:control",
    "clubs:manage",
    "audit:view",
    "reports:view",
  ],
  ADMIN: [
    "request:view_all",
    "analytics:view",
    "authorities:manage",
    "flow:control",
    "clubs:manage",
    "audit:view",
    "users:manage",
    "reports:view",
  ],
};

export function hasPermission(user: SessionUser, permission: Permission): boolean {
  return ROLE_PERMISSIONS[user.roleCode]?.includes(permission) ?? false;
}

export function isDeveloperUser(user: SessionUser): boolean {
  return user.email.toLowerCase() === DEVELOPER_DEMO_EMAIL;
}

/** System admin and developer portal accounts cannot act as workflow approvers. */
export function canApproveRequests(user: SessionUser): boolean {
  if (user.roleCode === "ADMIN") return false;
  return hasPermission(user, "request:approve");
}

export function canDeleteUsers(user: SessionUser): boolean {
  return isDeveloperUser(user);
}

export function isSuperAdmin(roleCode: RoleCode): boolean {
  return SUPER_ADMIN_ROLES.includes(roleCode);
}

export function isApprover(roleCode: RoleCode): boolean {
  return APPROVAL_ROLES.includes(roleCode);
}

/** Faculty may only view their own requests */
export function canViewRequest(
  user: SessionUser,
  request: {
    raisedById: string;
    departmentId: string;
    category: RequestCategory;
    clubId?: string | null;
    currentRoleCode?: RoleCode | null;
    workflowPath?: Prisma.JsonValue | null;
  },
  userClubIds?: string[]
): boolean {
  if (isSuperAdmin(user.roleCode)) return true;
  if (user.roleCode === "FACULTY" || user.roleCode === "HOD") {
    if (request.raisedById === user.id) return true;
  }
  if (user.roleCode === "HOD" && user.departmentId === request.departmentId) {
    if (request.category === "ACADEMIC") return true;
    if (request.currentRoleCode === "HOD") return true;
    const steps = parseWorkflowPath(request.workflowPath);
    return steps?.some((step) => step.roleCode === "HOD") ?? false;
  }
  if (["IQAC", "PMSEB", "HR", "COE"].includes(user.roleCode)) {
    return true;
  }
  if (user.roleCode === "CLUB_AUTHORITY" && request.category === "CLUB") {
    if (request.raisedById === user.id) return true;
    if (request.clubId && userClubIds?.includes(request.clubId)) return true;
    return false;
  }
  return false;
}

/** HOD may approve club requests when Registrar routes the workflow through HOD. */
export function canApproveAtStep(
  user: SessionUser,
  request: {
    category: RequestCategory;
    departmentId: string;
    currentRoleCode: RoleCode | null;
    clubId: string | null;
    academicSectionId?: string | null;
  },
  userClubIds?: string[]
): boolean {
  if (!canApproveRequests(user)) return false;
  if (!request.currentRoleCode || request.currentRoleCode !== user.roleCode) {
    return false;
  }
  if (user.roleCode === "HOD") {
    return user.departmentId === request.departmentId;
  }
  if (user.roleCode === "CLUB_AUTHORITY") {
    return (
      request.category === "CLUB" &&
      !!request.clubId &&
      (userClubIds?.includes(request.clubId) ?? false)
    );
  }
  return isApprover(user.roleCode);
}

export function getDashboardPath(roleCode: RoleCode): string {
  return "/dashboard";
}
