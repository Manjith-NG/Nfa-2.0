import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { canDeleteUsers } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit";
import { PROTECTED_SYSTEM_EMAILS } from "@/lib/constants";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const profile = await prisma.user.findUnique({
    where: { id, isActive: true },
    select: {
      id: true,
      employeeId: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      department: { select: { name: true, code: true } },
      designation: { select: { name: true } },
      position: { select: { name: true } },
      role: { select: { code: true, name: true } },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: profile });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canDeleteUsers(actor)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (id === actor.id) {
    return NextResponse.json({ success: false, error: "You cannot delete your own account" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
  });

  if (!target || !target.isActive) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  const email = target.email.toLowerCase();
  if (PROTECTED_SYSTEM_EMAILS.some((protectedEmail) => protectedEmail === email)) {
    return NextResponse.json(
      { success: false, error: "System accounts cannot be deleted" },
      { status: 400 }
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.authorityMapping.updateMany({
        where: { userId: id, isActive: true },
        data: { isActive: false, endDate: new Date() },
      });

      await tx.clubAuthority.updateMany({
        where: { userId: id, isActive: true },
        data: { isActive: false },
      });

      await tx.department.updateMany({
        where: { hodId: id },
        data: { hodId: null },
      });

      await tx.user.update({
        where: { id },
        data: { isActive: false },
      });
    });

    await createAuditLog({
      userId: actor.id,
      action: "USER_DELETED",
      entityType: "User",
      entityId: id,
      oldValue: { email: target.email, name: `${target.firstName} ${target.lastName}` },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete user";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
