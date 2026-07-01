import { prisma } from "@/lib/db";
import { fullName } from "@/lib/utils";
import type { SessionUser } from "@/types";

export type VerifiedReportPeriod = "daily" | "weekly" | "monthly" | "all";

export function verifiedReportPeriodLabel(period: VerifiedReportPeriod): string {
  switch (period) {
    case "daily":
      return "Today";
    case "weekly":
      return "Last 7 days";
    case "monthly":
      return "Last 30 days";
    case "all":
      return "All time";
    default: {
      const _exhaustive: never = period;
      return _exhaustive;
    }
  }
}

export function getVerifiedReportDateRange(
  period: VerifiedReportPeriod
): { from?: Date; to: Date } {
  const to = new Date();
  if (period === "all") return { to };

  const from = new Date();
  if (period === "daily") {
    from.setHours(0, 0, 0, 0);
    return { from, to };
  }
  if (period === "weekly") {
    from.setDate(from.getDate() - 7);
    return { from, to };
  }
  from.setDate(from.getDate() - 30);
  return { from, to };
}

export function parseVerifiedReportPeriod(value: string | null): VerifiedReportPeriod {
  if (value === "daily" || value === "weekly" || value === "monthly" || value === "all") {
    return value;
  }
  return "all";
}

export function canDownloadFullCertificate(
  user: SessionUser,
  request: { status: string; raisedById: string }
): boolean {
  if (request.status !== "COMPLETED") return false;
  if (request.raisedById === user.id) return true;
  return ["REGISTRAR", "OFC"].includes(user.roleCode);
}

export function canDownloadSummaryPdf(
  user: SessionUser,
  request: { status: string; raisedById: string }
): boolean {
  if (["REGISTRAR", "OFC"].includes(user.roleCode)) return true;
  if (request.raisedById === user.id && request.status !== "DRAFT") return true;
  return request.status === "COMPLETED";
}

/** @deprecated Use canDownloadFullCertificate or canDownloadSummaryPdf */
export function canDownloadRequestDocuments(
  user: SessionUser,
  request: { status: string; raisedById: string }
): boolean {
  return canDownloadFullCertificate(user, request);
}

export async function getRequestForPdf(id: string) {
  return prisma.request.findUnique({
    where: { id },
    include: {
      department: true,
      raisedBy: {
        select: { id: true, firstName: true, lastName: true, email: true, employeeId: true },
      },
      approvalHistory: {
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { firstName: true, lastName: true } } },
      },
    },
  });
}

export async function buildVerifiedRequestsCsv(
  period: VerifiedReportPeriod = "all"
): Promise<string> {
  const { from, to } = getVerifiedReportDateRange(period);
  const completedAtFilter =
    from != null
      ? { gte: from, lte: to }
      : undefined;

  const requests = await prisma.request.findMany({
    where: {
      status: "COMPLETED",
      ...(completedAtFilter ? { completedAt: completedAtFilter } : {}),
    },
    orderBy: { completedAt: "desc" },
    include: {
      department: true,
      academicSection: { select: { name: true } },
      raisedBy: { select: { firstName: true, lastName: true, email: true } },
      approvalHistory: {
        where: { action: { in: ["APPROVE", "REJECT", "RESEND"] } },
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  const headers = [
    "Request Number",
    "Title",
    "Department",
    "Academic Section",
    "Raised By",
    "Submitted At",
    "Verified At",
    "Event Date",
    "Event Start",
    "Event End",
    "Total Expenditure",
    "Authority Remarks",
  ];

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;

  const rows = requests.map((r) => {
    const remarks = r.approvalHistory
      .map((h) => {
        const who = fullName(h.actor.firstName, h.actor.lastName);
        const when = h.createdAt.toISOString();
        const note = h.remarks ? ` — ${h.remarks}` : "";
        return `${h.roleCode}/${h.action} by ${who} at ${when}${note}`;
      })
      .join(" | ");

    return [
      r.requestNumber,
      r.title,
      r.department.name,
      r.academicSection?.name ?? "",
      fullName(r.raisedBy.firstName, r.raisedBy.lastName),
      r.submittedAt?.toISOString() ?? "",
      r.completedAt?.toISOString() ?? "",
      r.eventDate?.toISOString() ?? "",
      r.eventStartDate?.toISOString() ?? "",
      r.eventEndDate?.toISOString() ?? "",
      r.grandTotalExpenditure?.toString() ?? "",
      remarks,
    ]
      .map(escape)
      .join(",");
  });

  return [headers.map(escape).join(","), ...rows].join("\n");
}
