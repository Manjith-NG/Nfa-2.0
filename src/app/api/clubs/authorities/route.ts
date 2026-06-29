import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  clubId: z.string(),
  userId: z.string(),
  expiresAt: z.string().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const authorities = await prisma.clubAuthority.findMany({
    where: { isActive: true },
    include: {
      club: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          department: { select: { name: true } },
        },
      },
    },
  });

  const clubs = await prisma.club.findMany({ where: { isActive: true } });

  return NextResponse.json({ success: true, data: { authorities, clubs } });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user, "clubs:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = schema.parse(await req.json());

    const authority = await prisma.clubAuthority.upsert({
      where: { clubId_userId: { clubId: data.clubId, userId: data.userId } },
      create: {
        clubId: data.clubId,
        userId: data.userId,
        assignedBy: user.id,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
      update: {
        isActive: true,
        assignedBy: user.id,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
      include: { club: true, user: true },
    });

    const clubAuthorityRole = await prisma.role.findUniqueOrThrow({
      where: { code: "CLUB_AUTHORITY" },
    });
    await prisma.user.update({
      where: { id: data.userId },
      data: { roleId: clubAuthorityRole.id },
    });

    await createAuditLog({
      userId: user.id,
      action: "CLUB_AUTHORITY_ASSIGNED",
      entityType: "ClubAuthority",
      entityId: authority.id,
      newValue: data,
    });

    return NextResponse.json({ success: true, data: authority }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
