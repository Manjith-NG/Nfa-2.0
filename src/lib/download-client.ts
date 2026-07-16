export async function downloadFromApi(url: string, fallbackFilename: string): Promise<void> {
  const downloadUrl = withDisposition(url, "attachment");
  const res = await fetch(downloadUrl, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Download failed" }));
    throw new Error(typeof err.error === "string" ? err.error : "Download failed");
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? fallbackFilename;

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function viewFromApi(url: string): Promise<void> {
  const viewUrl = withDisposition(url, "inline");
  const res = await fetch(viewUrl, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Could not open file" }));
    throw new Error(typeof err.error === "string" ? err.error : "Could not open file");
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const opened = window.open(objectUrl, "_blank", "noopener,noreferrer");
  if (!opened) {
    URL.revokeObjectURL(objectUrl);
    throw new Error("Pop-up blocked. Allow pop-ups to view the document.");
  }
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export function requestAttachmentUrl(
  requestId: string,
  attachmentId: string,
  disposition: "inline" | "attachment" = "attachment"
): string {
  return `/api/requests/${requestId}/attachments/${attachmentId}?disposition=${disposition}`;
}

export function canPreviewAttachment(mimeType: string, fileName: string): boolean {
  const type = mimeType.toLowerCase();
  if (type.startsWith("image/") || type === "application/pdf") return true;
  const lower = fileName.toLowerCase();
  return /\.(pdf|jpe?g|png|gif|webp)$/i.test(lower);
}

function withDisposition(url: string, disposition: "inline" | "attachment"): string {
  const parsed = new URL(url, "http://local");
  parsed.searchParams.set("disposition", disposition);
  return `${parsed.pathname}${parsed.search}`;
}
