import { prisma } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: object;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      metadata: params.metadata,
    },
  });
}

export async function notifyApprovers(params: {
  roleCode: string;
  departmentId?: string;
  title: string;
  message: string;
  link: string;
  excludeUserId?: string;
}) {
  const mappings = await prisma.authorityMapping.findMany({
    where: {
      roleCode: params.roleCode as never,
      isActive: true,
      ...(params.departmentId ? { departmentId: params.departmentId } : {}),
    },
    select: { userId: true },
  });

  const userIds = [...new Set(mappings.map((m) => m.userId))];

  if (params.roleCode === "HOD" && params.departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: params.departmentId },
      select: { hodId: true },
    });
    if (dept?.hodId) userIds.push(dept.hodId);
  }

  if (params.roleCode === "CLUB_AUTHORITY") {
    return;
  }

  const uniqueIds = [...new Set(userIds)].filter(
    (id) => id !== params.excludeUserId
  );

  await Promise.all(
    uniqueIds.map((userId) =>
      createNotification({
        userId,
        type: "APPROVAL_PENDING",
        title: params.title,
        message: params.message,
        link: params.link,
      })
    )
  );
}

export async function notifyClubAuthority(clubId: string, params: {
  title: string;
  message: string;
  link: string;
}) {
  const authorities = await prisma.clubAuthority.findMany({
    where: { clubId, isActive: true },
    select: { userId: true },
  });

  await Promise.all(
    authorities.map((a) =>
      createNotification({
        userId: a.userId,
        type: "APPROVAL_PENDING",
        title: params.title,
        message: params.message,
        link: params.link,
      })
    )
  );
}
