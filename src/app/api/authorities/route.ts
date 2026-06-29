import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const assignSchema = z.object({
  roleCode: z.enum(["IQAC", "PMSEB", "HR", "COE", "REGISTRAR", "OFC", "HOD"]),
  userId: z.string(),
  departmentId: z.string().optional(),
  assignmentType: z.enum(["TEMPORARY", "PERMANENT"]).default("PERMANENT"),
  endDate: z.string().optional(),
  reason: z.string().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user, "authorities:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mappings = await prisma.authorityMapping.findMany({
    where: { isActive: true },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          employeeId: true,
          department: { select: { name: true } },
        },
      },
      assignedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: [{ roleCode: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ success: true, data: mappings });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user, "authorities:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = assignSchema.parse(body);

    await prisma.authorityMapping.updateMany({
      where: {
        roleCode: data.roleCode,
        departmentId: data.departmentId ?? null,
        isActive: true,
        assignmentType: data.assignmentType,
      },
      data: { isActive: false, endDate: new Date() },
    });

    const mapping = await prisma.authorityMapping.create({
      data: {
        roleCode: data.roleCode,
        userId: data.userId,
        departmentId: data.departmentId,
        assignmentType: data.assignmentType,
        assignedById: user.id,
        endDate: data.endDate ? new Date(data.endDate) : null,
        reason: data.reason,
      },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });

    if (data.roleCode === "HOD" && data.departmentId) {
      await prisma.department.update({
        where: { id: data.departmentId },
        data: { hodId: data.userId },
      });
    }

    const assignableRole = await prisma.role.findUnique({
      where: { code: data.roleCode },
    });
    if (assignableRole) {
      await prisma.user.update({
        where: { id: data.userId },
        data: {
          roleId: assignableRole.id,
          ...(data.roleCode === "HOD" && data.departmentId
            ? { departmentId: data.departmentId }
            : {}),
        },
      });
    }

    await createAuditLog({
      userId: user.id,
      action: "AUTHORITY_ASSIGNED",
      entityType: "AuthorityMapping",
      entityId: mapping.id,
      newValue: data,
    });

    return NextResponse.json({ success: true, data: mapping }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Assignment failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
