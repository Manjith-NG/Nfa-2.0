import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function createAuditLog(params: {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}) {
  return prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldValue: params.oldValue,
      newValue: params.newValue,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}

export async function logWorkflowEvent(params: {
  requestId: string;
  userId?: string;
  event: string;
  fromStep?: number;
  toStep?: number;
  fromRole?: string;
  toRole?: string;
  details?: Prisma.InputJsonValue;
}) {
  return prisma.workflowLog.create({
    data: {
      requestId: params.requestId,
      userId: params.userId,
      event: params.event,
      fromStep: params.fromStep,
      toStep: params.toStep,
      fromRole: params.fromRole as never,
      toRole: params.toRole as never,
      details: params.details,
    },
  });
}
