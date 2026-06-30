import fs from "node:fs";
import path from "node:path";

const FULL_LOGO = path.join(process.cwd(), "public", "images", "gcu-logo-full.png");
const SQUARE_LOGO = path.join(process.cwd(), "public", "gcu-logo.png");

/** Default aspect ratio for the horizontal GCU wordmark (width / height). */
const FULL_LOGO_ASPECT = 4.2;

type PdfImageReader = PDFKit.PDFDocument & {
  openImage: (src: string) => { width: number; height: number };
};

export function getUniversityLogoPath(): string | null {
  if (fs.existsSync(FULL_LOGO)) return FULL_LOGO;
  if (fs.existsSync(SQUARE_LOGO)) return SQUARE_LOGO;
  return null;
}

function logoDimensions(
  doc: PDFKit.PDFDocument,
  logoPath: string,
  logoWidth: number
): number {
  try {
    const image = (doc as PdfImageReader).openImage(logoPath);
    if (image.width > 0 && image.height > 0) {
      return (image.height / image.width) * logoWidth;
    }
  } catch {
    // Fall back to a fixed aspect ratio when image metadata is unavailable.
  }
  return logoWidth / FULL_LOGO_ASPECT;
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

  const logoWidth = Math.min(pageWidth * 0.52, 210);
  const logoX = margin + (pageWidth - logoWidth) / 2;
  const logoHeight = logoDimensions(doc, logoPath, logoWidth);

  doc.image(logoPath, logoX, startY, { width: logoWidth });
  return startY + logoHeight + 16;
}
