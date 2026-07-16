import { createRequire } from "node:module";
import type PDFDocument from "pdfkit";

const require = createRequire(import.meta.url);

const PDFDocumentCtor = require("pdfkit") as typeof PDFDocument;

export function createPdfDocument(
  options?: PDFKit.PDFDocumentOptions
): PDFKit.PDFDocument {
  return new PDFDocumentCtor(options);
}
