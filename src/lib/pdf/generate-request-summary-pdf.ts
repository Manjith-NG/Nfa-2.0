import { createPdfDocument } from "@/lib/pdf/create-pdf-document";
import { APP_FULL_NAME, UNIVERSITY_NAME } from "@/lib/constants";
import type { CertificatePdfData } from "@/lib/pdf/pdf-certificate-shared";
import {
  buildSummaryNarrative,
  departmentHeading,
  fmtCertHeaderDate,
} from "@/lib/pdf/pdf-certificate-shared";

export type RequestSummaryPdfInput = CertificatePdfData & {
  completedAt?: Date | null;
  proposalDate?: Date | null;
};

export function generateRequestSummaryPdf(
  data: RequestSummaryPdfInput
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = createPdfDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    const margin = 50;
    const pageWidth = doc.page.width - margin * 2;

    doc.on("data", (chunk) => chunks.push(chunk as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#000000")
      .text("NOTE FOR APPROVAL OF CHANCELLOR", margin, margin, {
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

    doc
      .font("Helvetica")
      .fontSize(9)
      .text(`${APP_FULL_NAME} — Short Summary`, margin, doc.y + 4, {
        width: pageWidth,
        align: "center",
      });

    const headerDate = fmtCertHeaderDate(data.completedAt ?? data.proposalDate);
    doc.moveDown(0.8);
    const refY = doc.y;
    doc.text(`Ref. No: ${data.requestNumber}`, margin, refY, {
      width: pageWidth / 2,
      align: "left",
    });
    doc.text(`Date: ${headerDate}`, margin, refY, {
      width: pageWidth,
      align: "right",
    });

    doc.moveDown(1.2);
    doc.font("Helvetica-Bold").fontSize(10).text("Summary", margin, doc.y);

    doc.moveDown(0.4);
    const narrative = buildSummaryNarrative(data);
    doc.font("Helvetica").fontSize(10).fillColor("#0f172a").text(narrative, margin, doc.y, {
      width: pageWidth,
      align: "justify",
      lineGap: 4,
    });

    doc.moveDown(1.5);
    const finalStatus =
      data.status === "COMPLETED" ? "APPROVED" : data.status.toUpperCase();
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#000000")
      .text(`FINAL STATUS : ${finalStatus}`, margin, doc.y);

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
