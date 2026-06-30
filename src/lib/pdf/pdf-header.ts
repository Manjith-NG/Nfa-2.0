import { departmentHeading, fmtCertHeaderDate } from "@/lib/pdf/pdf-certificate-shared";
import { drawUniversityLogoHeader } from "@/lib/pdf/pdf-logo";

export function drawCertificateHeader(
  doc: PDFKit.PDFDocument,
  options: {
    margin: number;
    pageWidth: number;
    departmentName: string;
    subtitle?: string;
    requestNumber: string;
    headerDate: string | Date;
  }
): number {
  const { margin, pageWidth, departmentName, subtitle, requestNumber } = options;
  const headerDate = fmtCertHeaderDate(
    options.headerDate instanceof Date ? options.headerDate : new Date(options.headerDate)
  );

  let y = drawUniversityLogoHeader(doc, margin, pageWidth, margin);

  doc
    .strokeColor("#cbd5e1")
    .moveTo(margin, y - 6)
    .lineTo(margin + pageWidth, y - 6)
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#1e293b")
    .text("NOTE FOR APPROVAL OF CHANCELLOR", margin, y, {
      width: pageWidth,
      align: "center",
    });

  y = doc.y + 10;

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#000000")
    .text(departmentHeading(departmentName), margin, y, {
      width: pageWidth,
      align: "center",
    });

  y = doc.y + 6;

  if (subtitle) {
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#475569")
      .text(subtitle, margin, y, { width: pageWidth, align: "center" });
    y = doc.y + 12;
  } else {
    y = doc.y + 10;
  }

  doc.font("Helvetica").fontSize(9).fillColor("#000000");
  const refY = y;
  doc.text(`Ref. No: ${requestNumber}`, margin, refY, {
    width: pageWidth / 2,
    align: "left",
  });
  doc.text(`Date: ${headerDate}`, margin, refY, {
    width: pageWidth,
    align: "right",
  });

  return refY + 24;
}
