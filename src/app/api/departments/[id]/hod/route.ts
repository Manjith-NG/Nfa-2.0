import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({ userId: z.string() });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user, "authorities:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: departmentId } = await params;

  try {
    const { userId } = schema.parse(await req.json());

    const hodUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!hodUser) throw new Error("User not found");

    const dept = await prisma.department.update({
      where: { id: departmentId },
      data: { hodId: userId },
      include: {
        hod: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    const hodRole = await prisma.role.findUniqueOrThrow({ where: { code: "HOD" } });
    await prisma.user.update({
      where: { id: userId },
      data: { roleId: hodRole.id, departmentId },
    });

    await prisma.authorityMapping.updateMany({
      where: { roleCode: "HOD", departmentId, isActive: true },
      data: { isActive: false, endDate: new Date() },
    });

    await prisma.authorityMapping.create({
      data: {
        roleCode: "HOD",
        userId,
        departmentId,
        assignmentType: "PERMANENT",
        assignedById: user.id,
        isActive: true,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "HOD_ASSIGNED",
      entityType: "Department",
      entityId: departmentId,
      newValue: { hodUserId: userId },
    });

    return NextResponse.json({ success: true, data: dept });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Assignment failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
