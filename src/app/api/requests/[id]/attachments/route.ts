import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { canViewRequest, requestViewContext } from "@/lib/rbac";
import { getUserClubIds } from "@/lib/club-access";
import { saveRequestUpload } from "@/lib/upload";
import { createAuditLog } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const request = await prisma.request.findUnique({
    where: { id },
    include: { raisedBy: { include: { role: true } } },
  });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userClubIds =
    user.roleCode === "CLUB_AUTHORITY" ? await getUserClubIds(user.id) : undefined;
  if (!canViewRequest(user, requestViewContext({ ...request, raisedByRoleCode: request.raisedBy.role.code }), userClubIds)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const attachments = await prisma.requestAttachment.findMany({
    where: { requestId: id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, data: attachments });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const request = await prisma.request.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = request.raisedById === user.id;
  if (!isOwner) {
    return NextResponse.json({ error: "Only the request owner can upload documents" }, { status: 403 });
  }
  if (!["DRAFT", "RESEND"].includes(request.status)) {
    return NextResponse.json(
      { error: "Documents can only be uploaded for draft or resend requests" },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const saved = await saveRequestUpload(id, file);
    const attachment = await prisma.requestAttachment.create({
      data: {
        requestId: id,
        fileName: saved.fileName,
        filePath: saved.filePath,
        fileSize: saved.fileSize,
        mimeType: saved.mimeType,
        uploadedById: user.id,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "REQUEST_ATTACHMENT_UPLOAD",
      entityType: "RequestAttachment",
      entityId: attachment.id,
      newValue: { requestId: id, fileName: saved.fileName },
    });

    return NextResponse.json({ success: true, data: attachment }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
