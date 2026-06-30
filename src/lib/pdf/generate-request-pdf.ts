import { createPdfDocument } from "@/lib/pdf/create-pdf-document";
import { UNIVERSITY_NAME } from "@/lib/constants";
import type { CertificatePdfData } from "@/lib/pdf/pdf-certificate-shared";
import {
  authorityRows,
  budgetRows,
  buildBriefNoteDetails,
  departmentHeading,
  fmtCertHeaderDate,
} from "@/lib/pdf/pdf-certificate-shared";
import {
  drawMainCertificateRow,
  drawMainCertificateRowWithNested,
  drawNestedAuthorityTable,
  drawNestedBudgetTable,
  estimateNestedAuthorityHeight,
  estimateNestedBudgetHeight,
} from "@/lib/pdf/pdf-table";
import { drawUniversityLogoHeader } from "@/lib/pdf/pdf-logo";

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
    const colWidths = [32, 108, pageWidth - 32 - 108 - 78, 78];

    doc.on("data", (chunk) => chunks.push(chunk as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const contentY = drawUniversityLogoHeader(doc, margin, pageWidth, margin);

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#000000")
      .text("NOTE FOR APPROVAL OF CHANCELLOR", margin, contentY, {
        width: pageWidth,
        align: "center",
      });

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(departmentHeading(data.departmentName), margin, doc.y + 6, {
        width: pageWidth,
        align: "center",
      });

    const headerDate = fmtCertHeaderDate(data.completedAt ?? data.proposalDate);
    doc.moveDown(0.6);
    const refY = doc.y;
    doc.font("Helvetica").fontSize(9).text(`Ref. No: ${data.requestNumber}`, margin, refY, {
      width: pageWidth / 2,
      align: "left",
    });
    doc.text(`Date: ${headerDate}`, margin, refY, {
      width: pageWidth,
      align: "right",
    });

    let y = refY + 22;

    doc.font("Helvetica-Bold").fontSize(9);
    let cellX = margin;
    for (const header of ["S.No", "Category", "Details", "Remarks"]) {
      const idx = ["S.No", "Category", "Details", "Remarks"].indexOf(header);
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
      "Faculty Member",
      data.raisedByName,
      ""
    );

    y = drawMainCertificateRow(
      doc,
      margin,
      y,
      colWidths,
      "2",
      "Date and Brief Note",
      buildBriefNoteDetails(data),
      ""
    );

    y = drawMainCertificateRow(
      doc,
      margin,
      y,
      colWidths,
      "3",
      "Need / feasibility",
      data.needForProposal?.trim() || "—",
      ""
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
      "4",
      "Details of proposed budget",
      budgetNestedHeight,
      "",
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
      "5",
      "NAAC Criterion",
      data.naacCategory?.trim() || "—",
      ""
    );

    y = drawMainCertificateRow(
      doc,
      margin,
      y,
      colWidths,
      "6",
      "Metrics",
      data.metricsCategory?.trim() || "—",
      ""
    );

    y = drawMainCertificateRow(
      doc,
      margin,
      y,
      colWidths,
      "7",
      "Metric Description",
      data.financialDescription?.trim() || data.title || "—",
      ""
    );

    const authorities = authorityRows(data.approvalHistory);
    const authorityNestedHeight = estimateNestedAuthorityHeight(authorities);

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
      "Authorities",
      authorityNestedHeight,
      "",
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
