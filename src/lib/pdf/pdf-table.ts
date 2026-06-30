import type PDFDocument from "pdfkit";

export function drawBorderedTable(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  colWidths: number[],
  rows: { cells: string[]; bold?: boolean; fontSize?: number }[],
  options?: { minRowHeight?: number; headerBold?: boolean }
): number {
  const minRowHeight = options?.minRowHeight ?? 20;
  let currentY = y;

  for (const row of rows) {
    const fontSize = row.fontSize ?? 9;
    doc.fontSize(fontSize);

    let rowHeight = minRowHeight;
    for (let i = 0; i < row.cells.length; i++) {
      const cellHeight =
        doc.heightOfString(row.cells[i] || " ", {
          width: colWidths[i] - 8,
        }) + 8;
      rowHeight = Math.max(rowHeight, cellHeight);
    }

    let cellX = x;
    for (let i = 0; i < row.cells.length; i++) {
      doc.rect(cellX, currentY, colWidths[i], rowHeight).stroke("#000000");
      const isBold = row.bold ?? options?.headerBold ?? false;
      doc
        .font(isBold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(fontSize)
        .fillColor("#000000")
        .text(row.cells[i] ?? "", cellX + 4, currentY + 4, {
          width: colWidths[i] - 8,
          align: "left",
        });
      cellX += colWidths[i];
    }

    currentY += rowHeight;
  }

  return currentY;
}

export function drawNestedBudgetTable(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  receivableLines: string[],
  expenditureLines: string[]
): number {
  const colW = width / 2;
  const rows = Math.max(receivableLines.length, expenditureLines.length, 1);
  const bodyRows: { cells: string[]; bold?: boolean }[] = [
    { cells: ["Receivables (Rs)", "Expenditure (Rs)"], bold: true },
  ];

  for (let i = 0; i < rows; i++) {
    bodyRows.push({
      cells: [receivableLines[i] ?? "", expenditureLines[i] ?? ""],
    });
  }

  return drawBorderedTable(doc, x, y, [colW, colW], bodyRows, { minRowHeight: 18 });
}

export function drawNestedAuthorityTable(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  authorities: { authority: string; date: string; remarks: string }[]
): number {
  const colWidths = [width * 0.34, width * 0.28, width * 0.38];
  const rows: { cells: string[]; bold?: boolean }[] = [
    { cells: ["Authority", "Date & Time", "Status / Remarks"], bold: true },
  ];

  if (authorities.length === 0) {
    rows.push({ cells: ["—", "—", "—"] });
  } else {
    for (const entry of authorities) {
      rows.push({
        cells: [entry.authority, entry.date, entry.remarks || "—"],
      });
    }
  }

  return drawBorderedTable(doc, x, y, colWidths, rows, { minRowHeight: 20 });
}

export function drawMainCertificateRow(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  colWidths: number[],
  sNo: string,
  category: string,
  details: string
): number {
  const fontSize = 9;
  doc.fontSize(fontSize);

  const rowHeight = Math.max(
    22,
    doc.heightOfString(category, { width: colWidths[1] - 8 }) + 8,
    doc.heightOfString(details, { width: colWidths[2] - 8 }) + 8
  );

  let cellX = x;
  const cells = [sNo, category, details];
  for (let i = 0; i < cells.length; i++) {
    doc.rect(cellX, y, colWidths[i], rowHeight).stroke("#000000");
    doc
      .font(i === 0 ? "Helvetica-Bold" : "Helvetica")
      .fontSize(fontSize)
      .fillColor("#000000")
      .text(cells[i], cellX + 4, y + 4, {
        width: colWidths[i] - 8,
        align: "left",
      });
    cellX += colWidths[i];
  }

  return y + rowHeight;
}

export function drawMainCertificateRowWithNested(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  colWidths: number[],
  sNo: string,
  category: string,
  nestedHeight: number,
  drawNested: (nestedX: number, nestedY: number, nestedWidth: number) => number
): number {
  const rowHeight = Math.max(26, nestedHeight + 8);
  const nestedX = x + colWidths[0] + colWidths[1] + 4;
  const nestedY = y + 4;
  const nestedWidth = colWidths[2] - 8;

  doc.rect(x, y, colWidths[0], rowHeight).stroke("#000000");
  doc.rect(x + colWidths[0], y, colWidths[1], rowHeight).stroke("#000000");
  doc.rect(x + colWidths[0] + colWidths[1], y, colWidths[2], rowHeight).stroke("#000000");

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#000000")
    .text(sNo, x + 4, y + 4, { width: colWidths[0] - 8 });

  doc
    .font("Helvetica")
    .fontSize(9)
    .text(category, x + colWidths[0] + 4, y + 4, { width: colWidths[1] - 8 });

  drawNested(nestedX, nestedY, nestedWidth);
  return y + rowHeight;
}

export function estimateNestedBudgetHeight(
  _doc: PDFKit.PDFDocument,
  _width: number,
  receivableLines: string[],
  expenditureLines: string[]
): number {
  const rows = Math.max(receivableLines.length, expenditureLines.length, 1) + 1;
  return rows * 22;
}

export function estimateNestedAuthorityHeight(
  doc: PDFKit.PDFDocument,
  width: number,
  authorities: { authority: string; date: string; remarks: string }[]
): number {
  const colWidths = [width * 0.34, width * 0.28, width * 0.38];
  const rows =
    authorities.length === 0
      ? [{ authority: "—", date: "—", remarks: "—" }]
      : authorities;

  doc.fontSize(9);
  let total = 22;
  for (const entry of rows) {
    const rowHeight = Math.max(
      22,
      doc.heightOfString(entry.authority, { width: colWidths[0] - 8 }) + 8,
      doc.heightOfString(entry.date, { width: colWidths[1] - 8 }) + 8,
      doc.heightOfString(entry.remarks, { width: colWidths[2] - 8 }) + 8
    );
    total += rowHeight;
  }
  return total;
}
