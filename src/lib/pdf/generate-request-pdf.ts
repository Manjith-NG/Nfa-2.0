import { createPdfDocument } from "@/lib/pdf/create-pdf-document";
import { UNIVERSITY_NAME } from "@/lib/constants";
import type { CertificatePdfData } from "@/lib/pdf/pdf-certificate-shared";
import {
  authorityRows,
  budgetRows,
  buildBriefNoteDetails,
  fmtCertHeaderDate,
} from "@/lib/pdf/pdf-certificate-shared";
import { drawCertificateHeader } from "@/lib/pdf/pdf-header";
import { formatFacultyNameWithId } from "@/lib/pdf/pdf-faculty-block";
import {
  drawMainCertificateRow,
  drawMainCertificateRowWithNested,
  drawNestedAuthorityTable,
  drawNestedBudgetTable,
  estimateNestedAuthorityHeight,
  estimateNestedBudgetHeight,
} from "@/lib/pdf/pdf-table";

export type RequestPdfInput = CertificatePdfData & {
  raisedByEmail?: string;
  submittedAt?: Date | null;
  completedAt?: Date | null;
};

export function generateRequestPdf(data: RequestPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = createPdfDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];
    const margin = 40;
    const pageWidth = doc.page.width - margin * 2;
    const colWidths = [36, 128, pageWidth - 36 - 128];

    doc.on("data", (chunk) => chunks.push(chunk as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    let y = drawCertificateHeader(doc, {
      margin,
      pageWidth,
      departmentName: data.departmentName,
      requestNumber: data.requestNumber,
      headerDate: data.completedAt ?? data.proposalDate ?? new Date(),
    });

    doc.font("Helvetica-Bold").fontSize(9);
    let cellX = margin;
    for (const header of ["S.No", "Category", "Details"]) {
      const idx = ["S.No", "Category", "Details"].indexOf(header);
      doc.rect(cellX, y, colWidths[idx], 20).stroke("#000000");
      doc.text(header, cellX + 4, y + 5, { width: colWidths[idx] - 8 });
      cellX += colWidths[idx];
    }
    y += 20;

    y = drawMainCertificateRow(
      doc,
      margin,
      y,
      colWidths,
      "1",
      "Faculty Name",
      formatFacultyNameWithId(data.raisedByName, data.raisedByEmployeeId)
    );

    y = drawMainCertificateRow(
      doc,
      margin,
      y,
      colWidths,
      "2",
      "Department",
      data.departmentName
    );

    y = drawMainCertificateRow(
      doc,
      margin,
      y,
      colWidths,
      "3",
      "Date and Brief Note",
      buildBriefNoteDetails(data)
    );

    y = drawMainCertificateRow(
      doc,
      margin,
      y,
      colWidths,
      "4",
      "Need / feasibility",
      data.needForProposal?.trim() || "—"
    );

    const { receivableLines, expenditureLines } = budgetRows(data);
    const budgetNestedHeight = estimateNestedBudgetHeight(
      doc,
      colWidths[2] - 8,
      receivableLines,
      expenditureLines
    );

    y = drawMainCertificateRowWithNested(
      doc,
      margin,
      y,
      colWidths,
      "5",
      "Details of proposed budget",
      budgetNestedHeight,
      (nestedX, nestedY, nestedWidth) =>
        drawNestedBudgetTable(
          doc,
          nestedX,
          nestedY,
          nestedWidth,
          receivableLines,
          expenditureLines
        )
    );

    y = drawMainCertificateRow(
      doc,
      margin,
      y,
      colWidths,
      "6",
      "NAAC Criterion",
      data.naacCategory?.trim() || "—"
    );

    y = drawMainCertificateRow(
      doc,
      margin,
      y,
      colWidths,
      "7",
      "Metrics",
      [data.metricsCategory?.trim(), data.financialDescription?.trim()]
        .filter(Boolean)
        .join("; ") || "—"
    );

    const authorities = authorityRows(data.approvalHistory);
    const authorityNestedHeight = estimateNestedAuthorityHeight(
      doc,
      colWidths[2] - 8,
      authorities
    );

    if (y + authorityNestedHeight + 60 > doc.page.height - margin) {
      doc.addPage();
      y = margin;
    }

    y = drawMainCertificateRowWithNested(
      doc,
      margin,
      y,
      colWidths,
      "8",
      "Approval tracking",
      authorityNestedHeight,
      (nestedX, nestedY, nestedWidth) =>
        drawNestedAuthorityTable(doc, nestedX, nestedY, nestedWidth, authorities)
    );

    y += 16;
    const finalStatus =
      data.status === "COMPLETED" ? "APPROVED" : data.status.toUpperCase();
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(`FINAL STATUS : ${finalStatus}`, margin, y);

    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor("#64748b")
      .text(
        `${UNIVERSITY_NAME} · Generated ${fmtCertHeaderDate(new Date())}`,
        margin,
        doc.page.height - margin - 12,
        { width: pageWidth, align: "center" }
      );

    doc.end();
  });
}
