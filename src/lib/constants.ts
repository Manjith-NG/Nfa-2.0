import type { RequestStatus, RoleCode } from "@prisma/client";

export const APP_NAME = "NFA 2.0";
export const APP_FULL_NAME = "Note For Approval System";
export const UNIVERSITY_NAME = "Garden City University";

export const DEVELOPER_DEMO_EMAIL = "developer@gcu.edu.in";
export const ADMIN_DEMO_EMAIL = "admin@gcu.edu.in";

/** Demo portal accounts that must not be deleted via the UI */
export const PROTECTED_SYSTEM_EMAILS = [DEVELOPER_DEMO_EMAIL, ADMIN_DEMO_EMAIL] as const;

export const OFC_LABEL = "OFC";
export const OFC_FINAL_CLEARANCE_LABEL = "Awaiting Final Clearance";

export const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; color: string; bgClass: string; textClass: string }
> = {
  DRAFT: {
    label: "Draft",
    color: "#64748b",
    bgClass: "bg-slate-100",
    textClass: "text-slate-700",
  },
  PENDING: {
    label: "Pending",
    color: "#ea580c",
    bgClass: "bg-orange-50",
    textClass: "text-orange-700",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    color: "#2563eb",
    bgClass: "bg-blue-50",
    textClass: "text-blue-700",
  },
  APPROVED: {
    label: "Approved",
    color: "#16a34a",
    bgClass: "bg-green-50",
    textClass: "text-green-700",
  },
  REJECTED: {
    label: "Rejected",
    color: "#dc2626",
    bgClass: "bg-red-50",
    textClass: "text-red-700",
  },
  RESEND: {
    label: "Resend / Recheck",
    color: "#ca8a04",
    bgClass: "bg-yellow-50",
    textClass: "text-yellow-800",
  },
  FORWARDED: {
    label: "Forwarded",
    color: "#7c3aed",
    bgClass: "bg-violet-50",
    textClass: "text-violet-700",
  },
  COMPLETED: {
    label: "Verified",
    color: "#059669",
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-700",
  },
};

export const AWAITING_FINAL_CLEARANCE = {
  label: OFC_FINAL_CLEARANCE_LABEL,
  color: "#7c3aed",
  bgClass: "bg-violet-50",
  textClass: "text-violet-700",
};

export const ROLE_LABELS: Record<RoleCode, string> = {
  FACULTY: "Faculty",
  HOD: "Head of Department",
  CLUB_AUTHORITY: "Club Authority",
  IQAC: "IQAC",
  PMSEB: "PMSEB",
  HR: "Human Resources",
  COE: "Controller of Examinations",
  REGISTRAR: "Registrar",
  OFC: OFC_LABEL,
  ADMIN: "System Admin",
};

/** Academic flow: Faculty/HOD → HOD → IQAC → PMSEB → COE → Registrar → OFC */
export const ACADEMIC_WORKFLOW: { stepOrder: number; roleCode: RoleCode; stepLabel: string }[] = [
  { stepOrder: 1, roleCode: "HOD", stepLabel: "HOD Approval" },
  { stepOrder: 2, roleCode: "IQAC", stepLabel: "IQAC Approval" },
  { stepOrder: 3, roleCode: "PMSEB", stepLabel: "PMSEB Approval" },
  { stepOrder: 4, roleCode: "COE", stepLabel: "COE Approval" },
  { stepOrder: 5, roleCode: "REGISTRAR", stepLabel: "Registrar Approval" },
  { stepOrder: 6, roleCode: "OFC", stepLabel: "Awaiting Final Clearance" },
];

/** Club flow: skips HOD */
export const CLUB_WORKFLOW: { stepOrder: number; roleCode: RoleCode; stepLabel: string }[] = [
  { stepOrder: 1, roleCode: "CLUB_AUTHORITY", stepLabel: "Club Authority Approval" },
  { stepOrder: 2, roleCode: "IQAC", stepLabel: "IQAC Approval" },
  { stepOrder: 3, roleCode: "PMSEB", stepLabel: "PMSEB Approval" },
  { stepOrder: 4, roleCode: "COE", stepLabel: "COE Approval" },
  { stepOrder: 5, roleCode: "REGISTRAR", stepLabel: "Registrar Approval" },
  { stepOrder: 6, roleCode: "OFC", stepLabel: "Awaiting Final Clearance" },
];

export type NavItem = { href: string; label: string; icon: string; sectionLabel?: string };

export const SETTINGS_NAV_ITEM: NavItem = {
  href: "/settings",
  label: "Profile",
  icon: "Settings",
};

export const NAV_BY_ROLE: Record<RoleCode, NavItem[]> = {
  FACULTY: [
    { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/requests/new", label: "Raise Request", icon: "FilePlus" },
    { href: "/requests", label: "My Requests", icon: "Files" },
    { href: "/notifications", label: "Notifications", icon: "Bell" },
  ],
  HOD: [
    { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/approvals", label: "Pending Approvals", icon: "CheckSquare" },
    { href: "/requests/department", label: "Department Requests", icon: "Building2" },
    { href: "/department/staff", label: "Department Staff", icon: "Users" },
    { href: "/requests/new", label: "Raise Request", icon: "FilePlus" },
    { href: "/requests?mine=true", label: "My Requests", icon: "Files" },
    { href: "/notifications", label: "Notifications", icon: "Bell" },
  ],
  CLUB_AUTHORITY: [
    { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/approvals", label: "Club Approvals", icon: "CheckSquare" },
    { href: "/requests", label: "Club Requests", icon: "Files" },
    { href: "/notifications", label: "Notifications", icon: "Bell" },
  ],
  IQAC: [
    { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/requests/new", label: "Raise Request", icon: "FilePlus" },
    { href: "/requests?mine=true", label: "My Requests", icon: "Files" },
    { href: "/approvals", label: "Approval Queue", icon: "Inbox" },
    { href: "/approvals/history", label: "History", icon: "History" },
    { href: "/notifications", label: "Notifications", icon: "Bell" },
  ],
  PMSEB: [
    { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/requests/new", label: "Raise Request", icon: "FilePlus" },
    { href: "/requests?mine=true", label: "My Requests", icon: "Files" },
    { href: "/approvals", label: "Approval Queue", icon: "Inbox" },
    { href: "/approvals/history", label: "History", icon: "History" },
    { href: "/notifications", label: "Notifications", icon: "Bell" },
  ],
  HR: [
    { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/approvals", label: "Approval Queue", icon: "Inbox" },
    { href: "/approvals/history", label: "History", icon: "History" },
    { href: "/notifications", label: "Notifications", icon: "Bell" },
  ],
  COE: [
    { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/requests/new", label: "Raise Request", icon: "FilePlus" },
    { href: "/requests?mine=true", label: "My Requests", icon: "Files" },
    { href: "/approvals", label: "Approval Queue", icon: "Inbox" },
    { href: "/approvals/history", label: "History", icon: "History" },
    { href: "/notifications", label: "Notifications", icon: "Bell" },
  ],
  REGISTRAR: [
    { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/approvals/insight", label: "Role Queues", icon: "ClipboardList" },
    { href: "/requests", label: "All Requests", icon: "Files" },
    { href: "/approvals", label: "Approvals", icon: "CheckSquare" },
    { href: "/analytics", label: "Analytics", icon: "BarChart3" },
    { href: "/reports", label: "Reports", icon: "FileText" },
    { href: "/notifications", label: "Notifications", icon: "Bell" },
    { href: "/users", label: "User Management", icon: "Users", sectionLabel: "Administration" },
    { href: "/flow-control", label: "Sections & Flow", icon: "GitBranch" },
    { href: "/faculty", label: "Add Faculty", icon: "UserPlus" },
    { href: "/authorities", label: "Staff & Roles", icon: "UserCog" },
    { href: "/clubs/authorities", label: "Club Authorities", icon: "Users" },
    { href: "/audit-logs", label: "Audit Logs", icon: "Shield" },
  ],
  OFC: [
    { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/approvals/insight", label: "Role Queues", icon: "ClipboardList" },
    { href: "/requests", label: "All Requests", icon: "Files" },
    { href: "/approvals", label: "Approvals", icon: "CheckSquare" },
    { href: "/analytics", label: "Analytics", icon: "BarChart3" },
    { href: "/reports", label: "Reports", icon: "FileText" },
    { href: "/notifications", label: "Notifications", icon: "Bell" },
    { href: "/users", label: "User Management", icon: "Users", sectionLabel: "Administration" },
    { href: "/flow-control", label: "Sections & Flow", icon: "GitBranch" },
    { href: "/faculty", label: "Add Faculty", icon: "UserPlus" },
    { href: "/authorities", label: "Staff & Roles", icon: "UserCog" },
    { href: "/clubs/authorities", label: "Club Authorities", icon: "Users" },
    { href: "/audit-logs", label: "Audit Logs", icon: "Shield" },
  ],
  ADMIN: [
    { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/requests", label: "All Requests", icon: "Files" },
    { href: "/analytics", label: "Analytics", icon: "BarChart3" },
    { href: "/reports", label: "Reports", icon: "FileText" },
    { href: "/notifications", label: "Notifications", icon: "Bell" },
    { href: "/users", label: "User Management", icon: "Users", sectionLabel: "Administration" },
    { href: "/faculty", label: "Add Faculty", icon: "UserPlus" },
    { href: "/flow-control", label: "Sections & Flow", icon: "GitBranch" },
    { href: "/authorities", label: "Staff & Roles", icon: "UserCog" },
    { href: "/clubs/authorities", label: "Club Authorities", icon: "Users" },
    { href: "/audit-logs", label: "Audit Logs", icon: "Shield" },
  ],
};

export const SUPER_ADMIN_ROLES: RoleCode[] = ["REGISTRAR", "OFC", "ADMIN"];
export const APPROVAL_ROLES: RoleCode[] = [
  "HOD",
  "CLUB_AUTHORITY",
  "IQAC",
  "PMSEB",
  "HR",
  "COE",
  "REGISTRAR",
  "OFC",
];
