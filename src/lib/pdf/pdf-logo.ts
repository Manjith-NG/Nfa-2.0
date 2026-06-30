import fs from "node:fs";
import path from "node:path";

const FULL_LOGO = path.join(process.cwd(), "public", "images", "gcu-logo-full.png");
const SQUARE_LOGO = path.join(process.cwd(), "public", "gcu-logo.png");

export function getUniversityLogoPath(): string | null {
  if (fs.existsSync(FULL_LOGO)) return FULL_LOGO;
  if (fs.existsSync(SQUARE_LOGO)) return SQUARE_LOGO;
  return null;
}

/** Draws the university logo centered at the top; returns the Y position for content below. */
export function drawUniversityLogoHeader(
  doc: PDFKit.PDFDocument,
  margin: number,
  pageWidth: number,
  startY: number
): number {
  const logoPath = getUniversityLogoPath();
  if (!logoPath) return startY;

  const logoWidth = Math.min(pageWidth * 0.72, 300);
  const logoX = margin + (pageWidth - logoWidth) / 2;

  doc.image(logoPath, logoX, startY, { width: logoWidth });
  return doc.y + 14;
}
