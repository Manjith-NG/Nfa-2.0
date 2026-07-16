import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { canViewRequest } from "@/lib/rbac";
import { getUserClubIds } from "@/lib/club-access";
import { readRequestUpload } from "@/lib/upload";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, attachmentId } = await params;
  const disposition =
    new URL(req.url).searchParams.get("disposition") === "inline" ? "inline" : "attachment";
  const request = await prisma.request.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userClubIds =
    user.roleCode === "CLUB_AUTHORITY" ? await getUserClubIds(user.id) : undefined;
  if (!canViewRequest(user, request, userClubIds)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const attachment = await prisma.requestAttachment.findFirst({
    where: { id: attachmentId, requestId: id },
  });
  if (!attachment) return NextResponse.json({ error: "Attachment not found" }, { status: 404 });

  try {
    const buffer = await readRequestUpload(attachment.filePath);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": attachment.mimeType || "application/octet-stream",
        "Content-Disposition": `${disposition}; filename="${attachment.fileName.replace(/"/g, "")}"`,
        "Content-Length": String(attachment.fileSize),
        "Cache-Control": "private, no-cache",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found on server" }, { status: 404 });
  }
}
