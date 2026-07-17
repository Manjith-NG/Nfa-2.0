import type { RoleCode, RequestCategory, Prisma, RequestStatus } from "@prisma/client";
import type { SessionUser } from "@/types";
import { isHodEntryWorkflowPath } from "@/lib/workflow/resolve";
import { SUPER_ADMIN_ROLES, APPROVAL_ROLES, DEVELOPER_DEMO_EMAIL } from "./constants";

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

export function canEditUsers(user: SessionUser): boolean {
  return isDeveloperUser(user);
}

export function isSuperAdmin(roleCode: RoleCode): boolean {
  return SUPER_ADMIN_ROLES.includes(roleCode);
}

/** Short summary PDFs — Registrar, OFC, Admin, and Developer only. */
export function canAccessShortSummary(user: SessionUser): boolean {
  return isSuperAdmin(user.roleCode) || isDeveloperUser(user);
}

export function isApprover(roleCode: RoleCode): boolean {
  return APPROVAL_ROLES.includes(roleCode);
}

/** Faculty may only view their own requests */
export type RequestViewContext = {
  raisedById: string;
  raisedByRoleCode?: RoleCode;
  departmentId: string;
  category: RequestCategory;
  clubId?: string | null;
  currentRoleCode?: RoleCode | null;
  submittedAt?: Date | string | null;
  workflowPath?: Prisma.JsonValue | null;
  status?: RequestStatus;
};

export function requestViewContext(
  request: RequestViewContext & {
    raisedBy?: { role: { code: RoleCode } };
  }
): RequestViewContext {
  return {
    raisedById: request.raisedById,
    raisedByRoleCode: request.raisedByRoleCode ?? request.raisedBy?.role.code,
    departmentId: request.departmentId,
    category: request.category,
    clubId: request.clubId,
    currentRoleCode: request.currentRoleCode,
    submittedAt: request.submittedAt,
    workflowPath: request.workflowPath,
    status: request.status,
  };
}

export function canViewRequest(
  user: SessionUser,
  request: RequestViewContext,
  userClubIds?: string[]
): boolean {
  if (request.status === "DRAFT") {
    return request.raisedById === user.id;
  }
  if (isSuperAdmin(user.roleCode)) return true;
  if (request.raisedById === user.id) return true;
  if (user.roleCode === "FACULTY") return false;
  if (user.roleCode === "HOD") {
    if (user.departmentId !== request.departmentId) return false;
    if (request.category !== "ACADEMIC") return false;
    if (request.raisedByRoleCode !== "FACULTY") return false;
    if (request.submittedAt == null) return false;
    if (!isHodEntryWorkflowPath(request.workflowPath)) return false;
    if (request.currentRoleCode !== "HOD") return false;
    return ["PENDING", "UNDER_REVIEW", "FORWARDED"].includes(request.status ?? "DRAFT");
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
