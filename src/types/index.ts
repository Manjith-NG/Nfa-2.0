import type {
  RequestStatus,
  RequestCategory,
  RoleCode,
  ApprovalAction,
} from "@prisma/client";

export type { RequestStatus, RequestCategory, RoleCode, ApprovalAction };

export interface SessionUser {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  roleCode: RoleCode;
  roleName: string;
  departmentId: string | null;
  departmentCode: string | null;
  departmentName: string | null;
  designationName: string | null;
  positionName: string | null;
}

export interface DashboardStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  resend: number;
  underReview?: number;
  completed?: number;
}

export interface TimelineStep {
  id: string;
  stepOrder: number;
  roleCode: RoleCode;
  stepLabel: string;
  status: "completed" | "current" | "pending" | "rejected" | "skipped";
  actorName?: string;
  action?: ApprovalAction;
  remarks?: string;
  completedAt?: string;
}

export interface RequestListItem {
  id: string;
  requestNumber: string;
  title: string;
  category: RequestCategory;
  status: RequestStatus;
  departmentName: string;
  raisedByName: string;
  raisedById?: string;
  clubName?: string | null;
  currentRoleCode: RoleCode | null;
  createdAt: string;
  submittedAt: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
