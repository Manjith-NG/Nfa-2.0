import { prisma } from "@/lib/db";
import { fullName } from "@/lib/utils";
import type { BudgetLineJson } from "@/lib/pdf/pdf-certificate-shared";
import {
  generateBatchRequestSummaryPdf,
  type RequestSummaryPdfInput,
} from "@/lib/pdf/generate-request-summary-pdf";
import type { VerifiedReportPeriod } from "@/lib/reports/verified-report-options";
import { getVerifiedReportDateRange } from "@/lib/reports/verified-report-options";
import type { SessionUser } from "@/types";
import { canAccessShortSummary } from "@/lib/rbac";

export type { VerifiedReportFormat, VerifiedReportPeriod } from "@/lib/reports/verified-report-options";
export {
  getVerifiedReportDateRange,
  parseVerifiedReportFormat,
  parseVerifiedReportPeriod,
  verifiedReportFormatLabel,
  verifiedReportPeriodLabel,
} from "@/lib/reports/verified-report-options";

const VERIFIED_EXPORT_INCLUDE = {
  department: true,
  academicSection: { select: { name: true } },
  raisedBy: { select: { id: true, firstName: true, lastName: true, email: true, employeeId: true } },
  approvalHistory: {
    orderBy: { createdAt: "asc" as const },
    include: { actor: { select: { firstName: true, lastName: true } } },
  },
} as const;

export const MAX_VERIFIED_SUMMARY_PDF_EXPORT = 50;

export function canDownloadFullCertificate(
  user: SessionUser,
  request: { status: string; raisedById: string }
): boolean {
  if (request.status !== "COMPLETED") return false;
  if (request.raisedById === user.id) return true;
  return ["REGISTRAR", "OFC", "ADMIN"].includes(user.roleCode);
}

export function canDownloadSummaryPdf(
  user: SessionUser,
  request: { status: string; raisedById: string }
): boolean {
  if (request.status === "DRAFT") return false;
  return canAccessShortSummary(user);
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
    include: VERIFIED_EXPORT_INCLUDE,
  });
}

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseBudgetLines(value: unknown): BudgetLineJson[] | null {
  if (!Array.isArray(value)) return null;
  return value as BudgetLineJson[];
}

type VerifiedExportRequest = Awaited<ReturnType<typeof listVerifiedRequestsForPeriod>>[number];

export function mapRequestToSummaryPdfInput(request: VerifiedExportRequest): RequestSummaryPdfInput {
  return {
    requestNumber: request.requestNumber,
    title: request.title,
    status: request.status,
    departmentName: request.department.name,
    raisedByName: fullName(request.raisedBy.firstName, request.raisedBy.lastName),
    raisedByEmployeeId: request.raisedBy.employeeId,
    briefNote: request.briefNote,
    needForProposal: request.needForProposal,
    proposalDate: request.proposalDate,
    eventStartDate: request.eventStartDate,
    eventEndDate: request.eventEndDate,
    naacCategory: request.naacCategory,
    metricsCategory: request.metricsCategory,
    financialDescription: request.financialDescription,
    grandTotalExpenditure: toNumber(request.grandTotalExpenditure),
    grandTotalReceivable: toNumber(request.grandTotalReceivable),
    expenditures: parseBudgetLines(request.expenditures),
    receivables: parseBudgetLines(request.receivables),
    approvalHistory: request.approvalHistory.map((h) => ({
      stepOrder: h.stepOrder,
      roleCode: h.roleCode,
      action: h.action,
      actorName: fullName(h.actor.firstName, h.actor.lastName),
      remarks: h.remarks,
      createdAt: h.createdAt,
    })),
    completedAt: request.completedAt,
  };
}

async function listVerifiedRequestsForPeriod(period: VerifiedReportPeriod) {
  const { from, to } = getVerifiedReportDateRange(period);

  return prisma.request.findMany({
    where: {
      status: "COMPLETED",
      ...(from != null ? { completedAt: { gte: from, lte: to } } : {}),
    },
    orderBy: { completedAt: "desc" },
    include: VERIFIED_EXPORT_INCLUDE,
  });
}

export async function buildVerifiedShortSummaryPdf(
  period: VerifiedReportPeriod = "all"
): Promise<Buffer> {
  const requests = await listVerifiedRequestsForPeriod(period);
  if (requests.length === 0) {
    throw new Error("No verified requests found for the selected period.");
  }
  if (requests.length > MAX_VERIFIED_SUMMARY_PDF_EXPORT) {
    throw new Error(
      `Too many requests (${requests.length}). Narrow the period or export CSV. Maximum ${MAX_VERIFIED_SUMMARY_PDF_EXPORT} short summaries per download.`
    );
  }

  return generateBatchRequestSummaryPdf(requests.map(mapRequestToSummaryPdfInput));
}

export async function buildVerifiedRequestsCsv(
  period: VerifiedReportPeriod = "all"
): Promise<string> {
  const requests = await listVerifiedRequestsForPeriod(period);

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
      .filter((h) => ["APPROVE", "REJECT", "RESEND"].includes(h.action))
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
