import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { RequestStatus, RequestCategory, RoleCode } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isSuperAdmin } from "@/lib/rbac";
import { buildRequestWhere } from "@/lib/services/request-service";
import { fullName } from "@/lib/utils";
import type { DashboardStats, RequestListItem, SessionUser } from "@/types";

const PENDING_STATUSES: RequestStatus[] = ["PENDING", "UNDER_REVIEW", "FORWARDED"];

function statsFromStatusCounts(
  counts: { status: RequestStatus; count: number }[]
): DashboardStats {
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c.count])) as Partial<
    Record<RequestStatus, number>
  >;
  const total = counts.reduce((sum, c) => sum + c.count, 0);

  const completed = byStatus.COMPLETED ?? 0;

  return {
    total,
    pending: PENDING_STATUSES.reduce((sum, status) => sum + (byStatus[status] ?? 0), 0),
    // Workflow ends in COMPLETED ("Verified"); APPROVED is kept for legacy rows.
    approved: completed + (byStatus.APPROVED ?? 0),
    rejected: byStatus.REJECTED ?? 0,
    resend: byStatus.RESEND ?? 0,
    underReview: byStatus.UNDER_REVIEW ?? 0,
    completed,
  };
}

async function fetchRoleStageStats(
  user: SessionUser
): Promise<DashboardStats & { pendingForMe: number }> {
  const roleCode = user.roleCode;
  const stageFilter = { stageRole: roleCode } as const;

  const [pending, accepted, rejected, resend, total] = await Promise.all([
    prisma.request.count({
      where: buildRequestWhere(user, { ...stageFilter, stageOutcome: "pending" }),
    }),
    prisma.request.count({
      where: buildRequestWhere(user, { ...stageFilter, stageOutcome: "accepted" }),
    }),
    prisma.request.count({
      where: buildRequestWhere(user, { ...stageFilter, stageOutcome: "rejected" }),
    }),
    prisma.request.count({
      where: buildRequestWhere(user, { ...stageFilter, stageOutcome: "resend" }),
    }),
    prisma.request.count({
      where: buildRequestWhere(user, stageFilter),
    }),
  ]);

  return {
    total,
    pending,
    pendingForMe: pending,
    approved: accepted,
    rejected,
    resend,
    completed: accepted,
  };
}

async function fetchDashboardStats(
  user: SessionUser
): Promise<
  DashboardStats & {
    pendingForMe?: number;
    departmentCount?: number;
    clubRequests?: number;
    authorityCount?: number;
  }
> {
  if (user.roleCode === "REGISTRAR" || user.roleCode === "OFC") {
    return fetchRoleStageStats(user);
  }

  const baseWhere = buildRequestWhere(user, {});

  const statusPromise = prisma.request.groupBy({
    by: ["status"],
    where: baseWhere,
    _count: { _all: true },
  });

  const pendingForMePromise = prisma.request.count({
    where: buildRequestWhere(user, { pendingForMe: true }),
  });

  if (isSuperAdmin(user.roleCode)) {
    const [grouped, pendingForMe, departmentCount, clubRequests, authorityCount] =
      await Promise.all([
        statusPromise,
        pendingForMePromise,
        prisma.department.count({ where: { isActive: true } }),
        prisma.request.count({ where: { category: "CLUB" } }),
        prisma.authorityMapping.count({ where: { isActive: true } }),
      ]);

    const stats = statsFromStatusCounts(
      grouped.map((row) => ({ status: row.status, count: row._count._all }))
    );

    return { ...stats, pendingForMe, departmentCount, clubRequests, authorityCount };
  }

  const [grouped, pendingForMe] = await Promise.all([statusPromise, pendingForMePromise]);

  const stats = statsFromStatusCounts(
    grouped.map((row) => ({ status: row.status, count: row._count._all }))
  );

  return { ...stats, pendingForMe };
}

export const getDashboardStats = cache(fetchDashboardStats);

async function fetchRequestItems(
  user: SessionUser,
  options: {
    limit?: number;
    pendingForMe?: boolean;
    mine?: boolean;
    search?: string;
    status?: RequestStatus;
    statusIn?: RequestStatus[];
    category?: RequestCategory;
    currentRoleCode?: RoleCode;
    stageRole?: RoleCode;
    stageOutcome?: "accepted" | "pending" | "rejected" | "resend";
    academicSectionId?: string;
    clubId?: string;
    departmentId?: string;
  } = {}
): Promise<RequestListItem[]> {
  const limit = options.limit ?? 20;
  const where = buildRequestWhere(user, {
    pendingForMe: options.pendingForMe,
    mine: options.mine,
    search: options.search,
    status: options.status,
    statusIn: options.statusIn,
    category: options.category,
    currentRoleCode: options.currentRoleCode,
    stageRole: options.stageRole,
    stageOutcome: options.stageOutcome,
    academicSectionId: options.academicSectionId,
    clubId: options.clubId,
    departmentId: options.departmentId,
  });

  const items = await prisma.request.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      department: { select: { name: true, code: true } },
      raisedBy: { select: { id: true, firstName: true, lastName: true } },
      club: { select: { name: true } },
    },
  });

  return items.map((r) => ({
    id: r.id,
    requestNumber: r.requestNumber,
    title: r.title,
    category: r.category,
    status: r.status,
    departmentName: r.department.name,
    raisedByName: fullName(r.raisedBy.firstName, r.raisedBy.lastName),
    raisedById: r.raisedBy.id,
    clubName: r.club?.name ?? null,
    currentRoleCode: r.currentRoleCode,
    createdAt: r.createdAt.toISOString(),
    submittedAt: r.submittedAt?.toISOString() ?? null,
  }));
}

export const listRequestItems = cache(fetchRequestItems);

export type DashboardAnalytics = {
  departmentPerformance: { department: string; count: number }[];
  sectionBreakdown: { section: string; count: number }[];
  clubBreakdown: { club: string; count: number }[];
  categoryBreakdown: { category: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  monthlyTrend: { month: string; count: number }[];
  funnel: { submitted: number; completed: number; rejected: number; pending: number };
};

async function fetchDashboardAnalytics(): Promise<DashboardAnalytics> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [byDepartment, bySection, byClub, byCategory, byStatus, monthlyTrend, funnelCounts] =
    await Promise.all([
    prisma.request.groupBy({
      by: ["departmentId"],
      _count: { id: true },
      where: { createdAt: { gte: sixMonthsAgo } },
    }),
    prisma.request.groupBy({
      by: ["academicSectionId"],
      _count: { id: true },
      where: { category: "ACADEMIC", submittedAt: { not: null } },
    }),
    prisma.request.groupBy({
      by: ["clubId"],
      _count: { id: true },
      where: { category: "CLUB", submittedAt: { not: null } },
    }),
    prisma.request.groupBy({
      by: ["category"],
      _count: { id: true },
      where: { submittedAt: { not: null } },
    }),
    prisma.request.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.$queryRaw<{ month: string; count: number }[]>`
      SELECT strftime('%Y-%m', createdAt) as month, COUNT(*) as count
      FROM requests
      WHERE createdAt >= ${sixMonthsAgo.toISOString()}
      GROUP BY strftime('%Y-%m', createdAt)
      ORDER BY month
    `.catch(() => []),
    Promise.all([
      prisma.request.count({ where: { submittedAt: { not: null } } }),
      prisma.request.count({ where: { status: "COMPLETED" } }),
      prisma.request.count({ where: { status: "REJECTED" } }),
      prisma.request.count({
        where: { status: { in: PENDING_STATUSES } },
      }),
    ]),
  ]);

  const departments = await prisma.department.findMany({
    select: { id: true, name: true },
  });
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

  const clubs = await prisma.club.findMany({
    select: { id: true, name: true },
  });
  const clubMap = Object.fromEntries(clubs.map((c) => [c.id, c.name]));

  const academicSections = await prisma.academicSectionMaster.findMany({
    select: { id: true, name: true },
  });
  const sectionMap = Object.fromEntries(academicSections.map((s) => [s.id, s.name]));

  const [submitted, completed, rejected, pending] = funnelCounts;

  return {
    departmentPerformance: byDepartment.map((d) => ({
      department: deptMap[d.departmentId] ?? "Unknown",
      count: d._count.id,
    })),
    sectionBreakdown: bySection
      .filter((s) => s.academicSectionId)
      .map((s) => ({
        section: sectionMap[s.academicSectionId!] ?? "Unknown section",
        count: s._count.id,
      }))
      .sort((a, b) => b.count - a.count),
    clubBreakdown: byClub
      .filter((c) => c.clubId)
      .map((c) => ({
        club: clubMap[c.clubId!] ?? "Unknown club",
        count: c._count.id,
      }))
      .sort((a, b) => b.count - a.count),
    categoryBreakdown: byCategory.map((c) => ({
      category: c.category === "CLUB" ? "Club" : "Academic",
      count: c._count.id,
    })),
    statusBreakdown: byStatus.map((s) => ({
      status: s.status,
      count: s._count.id,
    })),
    monthlyTrend: (monthlyTrend as { month: string; count: number }[]).map((m) => ({
      month: m.month,
      count: Number(m.count),
    })),
    funnel: { submitted, completed, rejected, pending },
  };
}

export const getDashboardAnalytics = unstable_cache(
  fetchDashboardAnalytics,
  ["dashboard-analytics-v2"],
  { revalidate: 60 }
);
