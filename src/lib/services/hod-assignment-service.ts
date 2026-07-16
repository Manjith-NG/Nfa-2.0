import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type HodAssignParams = {
  departmentId: string;
  userId: string;
  assignedById: string;
  reason?: string;
};

export async function assignDepartmentHod(
  params: HodAssignParams,
  tx: Prisma.TransactionClient = prisma
) {
  const { departmentId, userId, assignedById, reason } = params;

  const dept = await tx.department.findUnique({
    where: { id: departmentId },
    select: { id: true, name: true, hodId: true },
  });
  if (!dept) throw new Error("Department not found");

  const hodUser = await tx.user.findUnique({ where: { id: userId } });
  if (!hodUser) throw new Error("User not found");

  if (dept.hodId === userId) {
    throw new Error("This person is already the HOD for this department");
  }

  const previousHodId = dept.hodId;

  await tx.department.update({
    where: { id: departmentId },
    data: { hodId: userId },
  });

  const hodRole = await tx.role.findUniqueOrThrow({ where: { code: "HOD" } });
  await tx.user.update({
    where: { id: userId },
    data: { roleId: hodRole.id, departmentId },
  });

  await tx.authorityMapping.updateMany({
    where: { roleCode: "HOD", departmentId, isActive: true },
    data: { isActive: false, endDate: new Date() },
  });

  await tx.authorityMapping.create({
    data: {
      roleCode: "HOD",
      userId,
      departmentId,
      assignmentType: "PERMANENT",
      assignedById,
      isActive: true,
      reason,
    },
  });

  if (previousHodId && previousHodId !== userId) {
    const stillHodElsewhere = await tx.department.findFirst({
      where: { hodId: previousHodId },
    });
    if (!stillHodElsewhere) {
      const facultyRole = await tx.role.findUniqueOrThrow({ where: { code: "FACULTY" } });
      await tx.user.update({
        where: { id: previousHodId },
        data: { roleId: facultyRole.id },
      });
    }
  }

  return { department: dept, previousHodId };
}
