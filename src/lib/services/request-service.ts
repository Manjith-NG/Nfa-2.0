import { prisma } from "@/lib/db";
import type { SessionUser } from "@/types";
import type {
  RequestCategory,
  RequestStatus,
  RoleCode,
  Prisma,
} from "@prisma/client";
import { generateRequestNumber, fullName } from "@/lib/utils";
import {
  getInitialStep,
  getNextStep,
  getStatusAfterAction,
} from "@/lib/workflow/engine";
import {
  getWorkflowStepsForRequest,
  resolveWorkflowForNewRequest,
  serializeWorkflowPath,
} from "@/lib/workflow/resolve";
import { canViewRequest, canApproveAtStep } from "@/lib/rbac";
import { getUserClubIds } from "@/lib/club-access";
import { createAuditLog, logWorkflowEvent } from "@/lib/audit";
import {
  createNotification,
  notifyApprovers,
  notifyClubAuthority,
} from "@/lib/notifications";
import { validateApprovalRemarks, validateRequestFormFields } from "@/lib/request-validation";

export async function createRequest(
  user: SessionUser,
  data: {
    title: string;
    description?: string;
    category: RequestCategory;
    academicSectionId?: string;
    requestTypeId?: string;
    clubId?: string;
    departmentId?: string;
    briefNote?: string;
    needForProposal?: string;
    proposalDate?: Date;
    eventStartDate?: Date;
    eventEndDate?: Date;
    links?: string;
    naacCategory?: string;
    metricsCategory?: string;
    budgetAmount?: number;
    budgetPurpose?: string;
    eventDate?: Date;
    venue?: string;
    expenditures?: unknown;
    receivables?: unknown;
    grandTotalExpenditure?: number;
    grandTotalReceivable?: number;
    budgetDifference?: number;
    financialDescription?: string;
    submit?: boolean;
  }
) {
  const departmentId = data.departmentId ?? user.departmentId;
  if (!departmentId) {
    throw new Error("Department is required to raise a request");
  }
  if (data.category === "CLUB" && !data.clubId) {
    throw new Error("Club selection is required for club requests");
  }
  if (data.category === "ACADEMIC" && !data.academicSectionId) {
    throw new Error("Academic section is required");
  }

  if (data.submit) {
    const validationError = validateRequestFormFields(
      {
        briefNote: data.briefNote ?? "",
        needForProposal: data.needForProposal ?? "",
        proposalDate: data.proposalDate?.toISOString().slice(0, 10),
        eventStartDate: data.eventStartDate?.toISOString().slice(0, 10),
        eventEndDate: data.eventEndDate?.toISOString().slice(0, 10),
        submit: true,
      },
      {
        expenditures: Array.isArray(data.expenditures)
          ? (data.expenditures as { particulars: string; remarks?: string }[]).map((l) => ({
              id: "",
              particulars: l.particulars ?? "",
              amount: "",
              quantity: "",
              remarks: l.remarks ?? "",
            }))
          : [],
        receivables: Array.isArray(data.receivables)
          ? (data.receivables as { particulars: string; remarks?: string }[]).map((l) => ({
              id: "",
              particulars: l.particulars ?? "",
              amount: "",
              quantity: "",
              remarks: l.remarks ?? "",
            }))
          : [],
      }
    );
    if (validationError) throw new Error(validationError);
  }

  const requestNumber = generateRequestNumber();
  let currentStep = 0;
  let currentRoleCode: RoleCode | null = null;
  let status: RequestStatus = "DRAFT";

  let workflowStepsForCreate = null;

  if (data.submit) {
    workflowStepsForCreate = await resolveWorkflowForNewRequest({
      category: data.category,
      requestTypeId: data.requestTypeId,
      academicSectionId: data.category === "ACADEMIC" ? data.academicSectionId : null,
      clubId: data.category === "CLUB" ? data.clubId : null,
    });
    const initial = getInitialStep(workflowStepsForCreate);
    currentStep = initial.step;
    currentRoleCode = initial.roleCode;
    status = "PENDING";
  }

  const request = await prisma.request.create({
    data: {
      requestNumber,
      title: data.title,
      description: data.description,
      category: data.category,
      academicSectionId:
        data.category === "ACADEMIC" ? data.academicSectionId : null,
      requestTypeId: data.requestTypeId,
      clubId: data.clubId,
      status,
      currentStep,
      currentRoleCode,
      workflowPath: workflowStepsForCreate
        ? (serializeWorkflowPath(workflowStepsForCreate) as unknown as Prisma.InputJsonValue)
        : undefined,
      raisedById: user.id,
      departmentId,
      briefNote: data.briefNote,
      needForProposal: data.needForProposal,
      proposalDate: data.proposalDate,
      eventStartDate: data.eventStartDate,
      eventEndDate: data.eventEndDate,
      links: data.links,
      naacCategory: data.naacCategory,
      metricsCategory: data.metricsCategory,
      budgetAmount: data.budgetAmount,
      budgetPurpose: data.budgetPurpose,
      eventDate: data.eventDate,
      venue: data.venue,
      expenditures: data.expenditures as Prisma.InputJsonValue | undefined,
      receivables: data.receivables as Prisma.InputJsonValue | undefined,
      grandTotalExpenditure: data.grandTotalExpenditure,
      grandTotalReceivable: data.grandTotalReceivable,
      budgetDifference: data.budgetDifference,
      financialDescription: data.financialDescription,
      submittedAt: data.submit ? new Date() : null,
    },
    include: {
      department: true,
      raisedBy: true,
      club: true,
    },
  });

  if (data.submit) {
    await prisma.approvalHistory.create({
      data: {
        requestId: request.id,
        stepOrder: 0,
        roleCode: user.roleCode,
        action: "SUBMIT",
        actorId: user.id,
        newStatus: "PENDING",
        remarks: "Request submitted",
      },
    });

    await notifyAfterRequestSubmit(
      user,
      request,
      departmentId,
      currentRoleCode,
      currentStep
    );
  }

  await createAuditLog({
    userId: user.id,
    action: data.submit ? "REQUEST_SUBMIT" : "REQUEST_DRAFT",
    entityType: "Request",
    entityId: request.id,
    newValue: { requestNumber, status },
  });

  return request;
}

async function notifyAfterRequestSubmit(
  user: SessionUser,
  request: {
    id: string;
    requestNumber: string;
    title: string;
    category: RequestCategory;
    clubId: string | null;
  },
  departmentId: string,
  currentRoleCode: RoleCode | null,
  currentStep: number
) {
  await logWorkflowEvent({
    requestId: request.id,
    userId: user.id,
    event: "REQUEST_SUBMITTED",
    toStep: currentStep,
    toRole: currentRoleCode ?? undefined,
  });

  const link = `/requests/${request.id}`;
  if (request.category === "CLUB" && request.clubId) {
    await notifyClubAuthority(request.clubId, {
      title: "New Club Request",
      message: `${request.requestNumber}: ${request.title}`,
      link,
    });
  } else if (currentRoleCode === "HOD") {
    await notifyApprovers({
      roleCode: "HOD",
      departmentId,
      title: "New Department Request",
      message: `${request.requestNumber}: ${request.title}`,
      link,
      excludeUserId: user.id,
    });
  } else if (currentRoleCode) {
    await notifyApprovers({
      roleCode: currentRoleCode,
      title: "New Academic Request",
      message: `${request.requestNumber}: ${request.title}`,
      link,
      excludeUserId: user.id,
    });
  }

  await createNotification({
    userId: user.id,
    type: "REQUEST_SUBMITTED",
    title: "Request Submitted",
    message: `Your request ${request.requestNumber} has been submitted.`,
    link,
  });
}

export async function submitDraftRequest(user: SessionUser, requestId: string) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { department: true, raisedBy: true, club: true },
  });

  if (!request) throw new Error("Request not found");
  if (request.raisedById !== user.id) throw new Error("Only the request owner can submit");
  if (request.status !== "DRAFT") throw new Error("Only draft requests can be submitted");

  const validationError = validateRequestFormFields(
    {
      briefNote: request.briefNote ?? "",
      needForProposal: request.needForProposal ?? "",
      proposalDate: request.proposalDate?.toISOString().slice(0, 10),
      eventStartDate: request.eventStartDate?.toISOString().slice(0, 10),
      eventEndDate: request.eventEndDate?.toISOString().slice(0, 10),
      submit: true,
    },
    {
      expenditures: Array.isArray(request.expenditures)
        ? (request.expenditures as { particulars: string; remarks?: string }[]).map((l) => ({
            id: "",
            particulars: l.particulars ?? "",
            amount: "",
            quantity: "",
            remarks: l.remarks ?? "",
          }))
        : [],
      receivables: Array.isArray(request.receivables)
        ? (request.receivables as { particulars: string; remarks?: string }[]).map((l) => ({
            id: "",
            particulars: l.particulars ?? "",
            amount: "",
            quantity: "",
            remarks: l.remarks ?? "",
          }))
        : [],
    }
  );
  if (validationError) throw new Error(validationError);

  const workflowStepsForCreate = await resolveWorkflowForNewRequest({
    category: request.category,
    requestTypeId: request.requestTypeId ?? undefined,
    academicSectionId: request.category === "ACADEMIC" ? request.academicSectionId : null,
    clubId: request.category === "CLUB" ? request.clubId : null,
  });
  const initial = getInitialStep(workflowStepsForCreate);
  const currentStep = initial.step;
  const currentRoleCode = initial.roleCode;

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: {
      status: "PENDING",
      currentStep,
      currentRoleCode,
      workflowPath: serializeWorkflowPath(workflowStepsForCreate) as unknown as Prisma.InputJsonValue,
      submittedAt: new Date(),
    },
    include: { department: true, raisedBy: true, club: true },
  });

  await prisma.approvalHistory.create({
    data: {
      requestId: updated.id,
      stepOrder: 0,
      roleCode: user.roleCode,
      action: "SUBMIT",
      actorId: user.id,
      newStatus: "PENDING",
      remarks: "Request submitted",
    },
  });

  await notifyAfterRequestSubmit(
    user,
    updated,
    updated.departmentId,
    currentRoleCode,
    currentStep
  );

  await createAuditLog({
    userId: user.id,
    action: "REQUEST_SUBMIT",
    entityType: "Request",
    entityId: updated.id,
    newValue: { requestNumber: updated.requestNumber, status: "PENDING" },
  });

  return updated;
}

export async function processApproval(
  user: SessionUser,
  requestId: string,
  action: "APPROVE" | "REJECT" | "RESEND",
  remarks?: string
) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { raisedBy: true, department: true },
  });

  if (!request) throw new Error("Request not found");

  const userClubIds =
    user.roleCode === "CLUB_AUTHORITY" ? await getUserClubIds(user.id) : undefined;

  if (!canViewRequest(user, request, userClubIds)) throw new Error("Access denied");
  if (!canApproveAtStep(user, request, userClubIds)) {
    throw new Error("You are not authorized to act on this request at the current step");
  }

  const remarksError = validateApprovalRemarks(remarks);
  if (remarksError) throw new Error(remarksError);

  const workflowSteps = await getWorkflowStepsForRequest(request);
  const next = getNextStep(workflowSteps, request.currentStep);
  const isLastStep = !next;

  let newStatus = getStatusAfterAction(action, isLastStep && action === "APPROVE");
  let newStep = request.currentStep;
  let newRoleCode: RoleCode | null = request.currentRoleCode;

  if (action === "APPROVE") {
    if (next) {
      newStep = next.stepOrder;
      newRoleCode = next.roleCode;
      newStatus = "PENDING";
    } else {
      const last = workflowSteps[workflowSteps.length - 1];
      newStep = last?.stepOrder ?? request.currentStep;
      newStatus = "COMPLETED";
      newRoleCode = null;
    }
  } else if (action === "REJECT") {
    newStatus = "REJECTED";
    newRoleCode = null;
  } else if (action === "RESEND") {
    newStatus = "RESEND";
  }

  const updated = await prisma.$transaction(async (tx) => {
    const req = await tx.request.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        currentStep: action === "APPROVE" ? newStep : request.currentStep,
        currentRoleCode: newRoleCode,
        completedAt: newStatus === "COMPLETED" ? new Date() : null,
      },
    });

    await tx.approvalHistory.create({
      data: {
        requestId,
        stepOrder: request.currentStep,
        roleCode: user.roleCode,
        action,
        actorId: user.id,
        previousStatus: request.status,
        newStatus,
        remarks,
      },
    });

    if (remarks) {
      await tx.remark.create({
        data: {
          requestId,
          authorId: user.id,
          content: remarks,
          isInternal: false,
        },
      });
    }

    return req;
  });

  await logWorkflowEvent({
    requestId,
    userId: user.id,
    event: `APPROVAL_${action}`,
    fromStep: request.currentStep,
    toStep: newStep,
    fromRole: request.currentRoleCode ?? undefined,
    toRole: newRoleCode ?? undefined,
    details: { remarks },
  });

  const link = `/requests/${requestId}`;
  const raiserName = fullName(request.raisedBy.firstName, request.raisedBy.lastName);

  if (action === "APPROVE" && isLastStep) {
    await createNotification({
      userId: request.raisedById,
      type: "REQUEST_COMPLETED",
      title: "Request verified",
      message: `${request.requestNumber} completed all approvals. Download your approval PDF from the request page.`,
      link,
    });
  } else {
    await createNotification({
      userId: request.raisedById,
      type: action === "APPROVE" ? "APPROVED" : action === "REJECT" ? "REJECTED" : "RESEND",
      title: `Request ${action === "APPROVE" ? "Approved" : action === "REJECT" ? "Rejected" : "Sent for Recheck"}`,
      message: `${request.requestNumber} was ${action.toLowerCase()} by ${user.firstName} ${user.lastName}.`,
      link,
    });
  }

  if (action === "APPROVE" && next && newRoleCode) {
    if (newRoleCode === "CLUB_AUTHORITY" && request.clubId) {
      await notifyClubAuthority(request.clubId, {
        title: "Approval Required",
        message: `${request.requestNumber}: ${request.title}`,
        link,
      });
    } else if (newRoleCode === "HOD") {
      await notifyApprovers({
        roleCode: "HOD",
        departmentId: request.departmentId,
        title: "Approval Required",
        message: `${request.requestNumber}: ${request.title}`,
        link,
      });
    } else {
      await notifyApprovers({
        roleCode: newRoleCode,
        title: "Approval Required",
        message: `${request.requestNumber}: ${request.title}`,
        link,
      });
    }
  }

  await createAuditLog({
    userId: user.id,
    action: `REQUEST_${action}`,
    entityType: "Request",
    entityId: requestId,
    oldValue: { status: request.status, step: request.currentStep },
    newValue: { status: newStatus, step: newStep },
  });

  return updated;
}

export function buildRequestWhere(
  user: SessionUser,
  filters?: {
    status?: RequestStatus;
    statusIn?: RequestStatus[];
    category?: RequestCategory;
    departmentId?: string;
    search?: string;
    pendingForMe?: boolean;
    mine?: boolean;
    currentRoleCode?: RoleCode;
    academicSectionId?: string;
    clubId?: string;
  }
): Prisma.RequestWhereInput {
  const where: Prisma.RequestWhereInput = {};

  if (filters?.mine) {
    where.raisedById = user.id;
  } else if (user.roleCode === "FACULTY") {
    where.raisedById = user.id;
  } else if (user.roleCode === "HOD") {
    if (filters?.pendingForMe) {
      where.departmentId = user.departmentId ?? undefined;
      where.currentRoleCode = "HOD";
      where.status = { in: ["PENDING", "UNDER_REVIEW", "FORWARDED", "RESEND"] };
    } else {
      where.OR = [
        { raisedById: user.id },
        {
          departmentId: user.departmentId ?? undefined,
          category: "ACADEMIC",
        },
      ];
    }
  } else if (user.roleCode === "CLUB_AUTHORITY") {
    where.category = "CLUB";
    where.club = {
      authorities: {
        some: { userId: user.id, isActive: true },
      },
    };
    if (filters?.pendingForMe) {
      where.currentRoleCode = "CLUB_AUTHORITY";
      where.status = { in: ["PENDING", "UNDER_REVIEW", "FORWARDED", "RESEND"] };
    }
  } else if (["IQAC", "PMSEB", "HR", "COE"].includes(user.roleCode)) {
    if (filters?.pendingForMe) {
      where.currentRoleCode = user.roleCode;
      where.status = { in: ["PENDING", "UNDER_REVIEW", "FORWARDED", "RESEND"] };
    }
  } else if (["REGISTRAR", "OFC"].includes(user.roleCode)) {
    if (filters?.pendingForMe) {
      where.currentRoleCode = user.roleCode;
      where.status = { in: ["PENDING", "UNDER_REVIEW", "FORWARDED", "RESEND"] };
    }
  }

  if (filters?.status) where.status = filters.status;
  if (filters?.statusIn?.length) where.status = { in: filters.statusIn };
  if (filters?.category) where.category = filters.category;
  if (filters?.departmentId) where.departmentId = filters.departmentId;
  if (filters?.currentRoleCode) where.currentRoleCode = filters.currentRoleCode;
  if (filters?.academicSectionId) where.academicSectionId = filters.academicSectionId;
  if (filters?.clubId) where.clubId = filters.clubId;
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { requestNumber: { contains: filters.search } },
    ];
  }

  return where;
}
