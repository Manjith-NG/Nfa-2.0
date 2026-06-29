import type { RoleCode } from "@prisma/client";

export interface BudgetLineJson {
  particulars?: string;
  amount?: string;
  quantity?: string;
  remarks?: string;
}

export interface PdfApprovalEntry {
  stepOrder: number;
  roleCode: RoleCode;
  action: string;
  actorName: string;
  remarks?: string | null;
  createdAt: Date;
}

export interface CertificatePdfData {
  requestNumber: string;
  title: string;
  status: string;
  departmentName: string;
  raisedByName: string;
  briefNote?: string | null;
  needForProposal?: string | null;
  proposalDate?: Date | null;
  eventStartDate?: Date | null;
  eventEndDate?: Date | null;
  completedAt?: Date | null;
  naacCategory?: string | null;
  metricsCategory?: string | null;
  financialDescription?: string | null;
  grandTotalExpenditure?: number | null;
  grandTotalReceivable?: number | null;
  expenditures?: BudgetLineJson[] | null;
  receivables?: BudgetLineJson[] | null;
  approvalHistory: PdfApprovalEntry[];
}

export const CERT_AUTHORITY_LABELS: Partial<Record<RoleCode, string>> = {
  HOD: "Head of Department",
  CLUB_AUTHORITY: "Club Authority",
  IQAC: "IQAC",
  PMSEB: "PMSEB",
  HR: "Human Resources",
  COE: "Controller of Examinations",
  REGISTRAR: "Registrar",
  OFC: "Final Approval – Chancellor",
};

export function fmtCertDate(d?: Date | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export function fmtCertHeaderDate(d?: Date | null): string {
  if (!d) return fmtCertDate(new Date());
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
}

export function fmtMoney(n?: number | null): string {
  if (n == null) return "—";
  return `₹${n.toLocaleString("en-IN")}`;
}

function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const suffix = ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${suffix}`;
}

export function formatEventPeriodLong(
  start?: Date | null,
  end?: Date | null
): string | null {
  if (!start && !end) return null;
  if (start && end) {
    const s = new Date(start);
    const e = new Date(end);
    const sm = s.toLocaleDateString("en-IN", { month: "long" });
    const em = e.toLocaleDateString("en-IN", { month: "long" });
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
      return `${ordinal(s.getDate())} to ${ordinal(e.getDate())} ${em} ${e.getFullYear()}`;
    }
    return `${ordinal(s.getDate())} ${sm} ${s.getFullYear()} to ${ordinal(e.getDate())} ${em} ${e.getFullYear()}`;
  }
  const d = new Date(start ?? end!);
  return `${ordinal(d.getDate())} ${d.toLocaleDateString("en-IN", { month: "long" })} ${d.getFullYear()}`;
}

export function departmentHeading(name: string): string {
  const upper = name.toUpperCase();
  if (upper.startsWith("DEPARTMENT")) return upper;
  return `DEPARTMENT OF ${upper}`;
}

export function buildBriefNoteDetails(data: CertificatePdfData): string {
  const parts: string[] = [];
  if (data.briefNote?.trim()) parts.push(data.briefNote.trim());
  const period = formatEventPeriodLong(data.eventStartDate, data.eventEndDate);
  if (period) {
    parts.push(
      parts.length > 0 ? `(Event Date ${period})` : `Event Date ${period}`
    );
  }
  if (parts.length === 0 && data.title) parts.push(data.title);
  return parts.join(" ") || "—";
}

function lineAmount(line: BudgetLineJson): number {
  const amount = parseFloat(line.amount ?? "0") || 0;
  const qty = parseFloat(line.quantity ?? "1") || 1;
  return amount * qty;
}

export function budgetRows(data: CertificatePdfData): {
  receivableLines: string[];
  expenditureLines: string[];
} {
  const receivableLines =
    data.receivables
      ?.filter((l) => l.particulars?.trim() || lineAmount(l) > 0)
      .map((l) => {
        const label = l.particulars?.trim() || "Receivable";
        return `${label}: ${fmtMoney(lineAmount(l))}`;
      }) ?? [];

  const expenditureLines =
    data.expenditures
      ?.filter((l) => l.particulars?.trim() || lineAmount(l) > 0)
      .map((l) => {
        const label = l.particulars?.trim() || "Expenditure";
        return `${label}: ${fmtMoney(lineAmount(l))}`;
      }) ?? [];

  if (receivableLines.length === 0 && data.grandTotalReceivable != null) {
    receivableLines.push(fmtMoney(data.grandTotalReceivable));
  }
  if (expenditureLines.length === 0 && data.grandTotalExpenditure != null) {
    expenditureLines.push(fmtMoney(data.grandTotalExpenditure));
  }

  return { receivableLines, expenditureLines };
}

export function authorityRows(
  history: PdfApprovalEntry[]
): { authority: string; date: string; remarks: string }[] {
  return history
    .filter((h) => h.action === "APPROVE")
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((h) => ({
      authority: CERT_AUTHORITY_LABELS[h.roleCode] ?? h.roleCode,
      date: fmtCertDate(h.createdAt),
      remarks: h.remarks?.trim() ?? "",
    }));
}

export function buildSummaryNarrative(data: CertificatePdfData): string {
  const deptLabel = data.departmentName.match(/^department of/i)
    ? data.departmentName
    : `Department of ${data.departmentName}`;

  const activity = data.title?.trim() || "the proposed activity";
  const period = formatEventPeriodLong(data.eventStartDate, data.eventEndDate);

  let opening = `The ${deptLabel} conducted ${activity}`;
  if (period) opening += ` from ${period}`;
  opening += ".";

  const needText =
    data.needForProposal?.trim() ||
    data.briefNote?.trim() ||
    "A proposal was submitted for approval and clearance.";
  const need = needText.endsWith(".") ? ` ${needText}` : ` ${needText}.`;

  let budget = "";
  if (data.grandTotalReceivable != null || data.grandTotalExpenditure != null) {
    const recv =
      data.grandTotalReceivable != null
        ? fmtMoney(data.grandTotalReceivable)
        : null;
    const exp =
      data.grandTotalExpenditure != null
        ? fmtMoney(data.grandTotalExpenditure)
        : null;
    if (recv && exp) {
      budget = ` The total receivable amount was ${recv}, and the expenditure was ${exp}.`;
    } else if (recv) {
      budget = ` The total receivable amount was ${recv}.`;
    } else if (exp) {
      budget = ` The expenditure was ${exp}.`;
    }
  }

  const ofcApproval = data.approvalHistory.find(
    (h) => h.roleCode === "OFC" && h.action === "APPROVE"
  );

  let closing = "After approvals from the concerned authorities, the proposal was verified.";
  if (ofcApproval) {
    const date = new Date(ofcApproval.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const remark = ofcApproval.remarks?.trim();
    if (remark) {
      closing = `After approvals from the concerned authorities, ${remark.replace(/\.$/, "")} on ${date}.`;
    } else {
      closing = `After approvals from the concerned authorities, the Chancellor approved the proposal on ${date}.`;
    }
  }

  const status = data.status === "COMPLETED" ? "Approved" : data.status;
  return `${opening}${need}${budget} ${closing} The proposal status is ${status}.`;
}
