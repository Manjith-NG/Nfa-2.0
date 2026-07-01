import { createPdfDocument } from "@/lib/pdf/create-pdf-document";
import { APP_FULL_NAME, UNIVERSITY_NAME } from "@/lib/constants";
import type { CertificatePdfData } from "@/lib/pdf/pdf-certificate-shared";
import {
  buildSummaryNarrative,
  fmtCertHeaderDate,
} from "@/lib/pdf/pdf-certificate-shared";
import { drawCertificateHeader } from "@/lib/pdf/pdf-header";
import { drawLabeledDetailRows } from "@/lib/pdf/pdf-faculty-block";

export type RequestSummaryPdfInput = CertificatePdfData & {
  completedAt?: Date | null;
  proposalDate?: Date | null;
};

const SUMMARY_MARGIN = 50;

export function drawRequestSummaryPage(
  doc: PDFKit.PDFDocument,
  data: RequestSummaryPdfInput,
  margin = SUMMARY_MARGIN
): void {
  const pageWidth = doc.page.width - margin * 2;

  const bodyY = drawCertificateHeader(doc, {
    margin,
    pageWidth,
    departmentName: data.departmentName,
    subtitle: `${APP_FULL_NAME} — Short Report`,
    requestNumber: data.requestNumber,
    headerDate: data.completedAt ?? data.proposalDate ?? new Date(),
  });

  const reportY = drawLabeledDetailRows(doc, margin, pageWidth, bodyY, [
    { label: "Faculty Name", value: data.raisedByName },
    { label: "Faculty ID", value: data.raisedByEmployeeId?.trim() || "—" },
    { label: "Department", value: data.departmentName },
  ]);

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#000000").text("Report", margin, reportY);

  doc.moveDown(0.4);
  const narrative = buildSummaryNarrative(data);
  doc.font("Helvetica").fontSize(10).fillColor("#0f172a").text(narrative, margin, doc.y, {
    width: pageWidth,
    align: "justify",
    lineGap: 4,
  });

  doc.moveDown(1.5);
  const finalStatus = data.status === "COMPLETED" ? "APPROVED" : data.status.toUpperCase();
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
}

export function generateRequestSummaryPdf(data: RequestSummaryPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = createPdfDocument({ margin: SUMMARY_MARGIN, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    drawRequestSummaryPage(doc, data);
    doc.end();
  });
}

export function generateBatchRequestSummaryPdf(
  items: RequestSummaryPdfInput[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = createPdfDocument({ margin: SUMMARY_MARGIN, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    items.forEach((item, index) => {
      if (index > 0) doc.addPage();
      drawRequestSummaryPage(doc, item);
    });

    doc.end();
  });
}
