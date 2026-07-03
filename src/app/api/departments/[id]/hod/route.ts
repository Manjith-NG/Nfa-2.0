import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit";
import { assignDepartmentHod } from "@/lib/services/hod-assignment-service";
import { z } from "zod";

const schema = z.object({
  userId: z.string(),
  reason: z.string().optional(),
});

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
    const { userId, reason } = schema.parse(await req.json());

    const result = await prisma.$transaction(async (tx) =>
      assignDepartmentHod(
        { departmentId, userId, assignedById: user.id, reason },
        tx
      )
    );

    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        hod: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "HOD_ASSIGNED",
      entityType: "Department",
      entityId: departmentId,
      newValue: { hodUserId: userId, previousHodId: result.previousHodId },
    });

    return NextResponse.json({ success: true, data: dept });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Assignment failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
