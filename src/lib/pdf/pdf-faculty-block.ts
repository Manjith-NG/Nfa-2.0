import type PDFDocument from "pdfkit";

export function drawLabeledDetailRows(
  doc: PDFKit.PDFDocument,
  margin: number,
  pageWidth: number,
  startY: number,
  rows: { label: string; value: string }[]
): number {
  let y = startY;

  for (const row of rows) {
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#334155")
      .text(`${row.label}:`, margin, y, { width: 110 });

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#0f172a")
      .text(row.value, margin + 112, y, { width: pageWidth - 112 });

    y = doc.y + 8;
  }

  return y + 4;
}

export function formatFacultyNameWithId(
  name: string,
  employeeId?: string | null
): string {
  const id = employeeId?.trim();
  return id ? `${name} (${id})` : name;
}
