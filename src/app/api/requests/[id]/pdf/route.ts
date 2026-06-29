import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session";

import { fullName } from "@/lib/utils";

import { generateRequestPdf } from "@/lib/pdf/generate-request-pdf";

import { generateRequestSummaryPdf } from "@/lib/pdf/generate-request-summary-pdf";

import type { BudgetLineJson } from "@/lib/pdf/pdf-certificate-shared";

import {
  canDownloadFullCertificate,
  canDownloadSummaryPdf,
  getRequestForPdf,
} from "@/lib/services/request-export-service";



export const runtime = "nodejs";



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



export async function GET(

  req: NextRequest,

  { params }: { params: Promise<{ id: string }> }

) {

  const user = await getCurrentUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });



  const { id } = await params;

  const type = req.nextUrl.searchParams.get("type") ?? "full";

  const request = await getRequestForPdf(id);
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canDownload =
    type === "summary"
      ? canDownloadSummaryPdf(user, request)
      : canDownloadFullCertificate(user, request);

  if (!canDownload) {
    return NextResponse.json(
      {
        error:
          type === "summary"
            ? "Short summary is available after the request is submitted, or anytime for Registrar and OFC."
            : "Full approval certificate is available only after OFC verification (Verified status).",
      },
      { status: 403 }
    );
  }



  const approvalHistory = request.approvalHistory.map((h) => ({

    stepOrder: h.stepOrder,

    roleCode: h.roleCode,

    action: h.action,

    actorName: fullName(h.actor.firstName, h.actor.lastName),

    remarks: h.remarks,

    createdAt: h.createdAt,

  }));



  const raisedByName = fullName(request.raisedBy.firstName, request.raisedBy.lastName);



  const certificateData = {

    requestNumber: request.requestNumber,

    title: request.title,

    status: request.status,

    departmentName: request.department.name,

    raisedByName,

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

    approvalHistory,

    completedAt: request.completedAt,

    submittedAt: request.submittedAt,

  };



  try {

    if (type === "summary") {

      const pdf = await generateRequestSummaryPdf(certificateData);



      const filename = `${request.requestNumber.replace(/\s+/g, "-")}-summary.pdf`;

      return new NextResponse(new Uint8Array(pdf), {

        status: 200,

        headers: {

          "Content-Type": "application/pdf",

          "Content-Disposition": `attachment; filename="${filename}"`,

          "Cache-Control": "private, no-cache",

        },

      });

    }



    const pdf = await generateRequestPdf({

      ...certificateData,

      raisedByEmail: request.raisedBy.email,

    });



    const filename = `${request.requestNumber.replace(/\s+/g, "-")}-approval.pdf`;



    return new NextResponse(new Uint8Array(pdf), {

      status: 200,

      headers: {

        "Content-Type": "application/pdf",

        "Content-Disposition": `attachment; filename="${filename}"`,

        "Cache-Control": "private, no-cache",

      },

    });

  } catch (e) {

    const message = e instanceof Error ? e.message : "Failed to generate PDF";

    return NextResponse.json({ error: message }, { status: 500 });

  }

}

