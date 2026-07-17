import { prisma } from "@/lib/db";
import type { SessionUser } from "@/types";
import type {
  RequestCategory,
  RequestStatus,
  RoleCode,
  Prisma,
} from "@prisma/client";
import { fullName } from "@/lib/utils";
import { generateRequestNumber } from "@/lib/services/request-number";
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
import type { WorkflowPathStep } from "@/lib/workflow/types";
import { canViewRequest, canApproveAtStep, canApproveRequests, requestViewContext } from "@/lib/rbac";
import { getUserClubIds } from "@/lib/club-access";
import { createAuditLog, logWorkflowEvent } from "@/lib/audit";
import {
  createNotification,
  notifyApprovers,
  notifyClubAuthority,
} from "@/lib/notifications";
import { validateApprovalRemarks, validateRequestFormFields } from "@/lib/request-validation";

const HOD_QUEUE_STATUSES: RequestStatus[] = ["PENDING", "UNDER_REVIEW", "FORWARDED"];

/** Draft requests are visible only to the person who created them. */
export function draftVisibilityWhere(userId: string): Prisma.RequestWhereInput {
  return {
    OR: [{ status: { not: "DRAFT" } }, { raisedById: userId }],
  };
}

/** Workflow whose first approval step is HOD (department faculty flow). */
export const hodEntryWorkflowWhere: Prisma.RequestWhereInput = {
  workflowPath: {
    path: ["0", "roleCode"],
    equals: "HOD",
  },
};

/** Academic requests raised by faculty in the HOD's department (HOD approval queue scope). */
export function hodFacultyDepartmentWhere(
  departmentId: string | null | undefined
): Prisma.RequestWhereInput {
  if (!departmentId) {
    return { id: { equals: "__none__" } };
  }

  return {
    departmentId,
    category: "ACADEMIC",
    submittedAt: { not: null },
    raisedBy: { role: { code: "FACULTY" } },
  };
}

/** Faculty HOD-entry requests currently waiting on this department's HOD. */
export function hodFacultyQueueWhere(
  departmentId: string | null | undefined
): Prisma.RequestWhereInput {
  return {
    AND: [
      hodFacultyDepartmentWhere(departmentId),
      hodEntryWorkflowWhere,
      { currentRoleCode: "HOD" },
      { status: { in: HOD_QUEUE_STATUSES } },
    ],
  };
}

type SubmitWorkflowPosition = {
  currentStep: number;
  currentRoleCode: RoleCode | null;
  status: RequestStatus;
  autoApprovedSteps: { stepOrder: number; roleCode: RoleCode }[];
};

/** When HOD raises a department academic request, skip their own HOD approval step(s). */
export function resolveSubmitWorkflowPosition(
  user: SessionUser,
  workflowSteps: WorkflowPathStep[],
  options: {
    category: RequestCategory;
    startStep?: number;
    startRoleCode?: RoleCode | null;
  }
): SubmitWorkflowPosition {
  const initial = getInitialStep(workflowSteps);
  let currentStep = options.startStep ?? initial.step;
  let currentRoleCode: RoleCode | null =
    options.startRoleCode !== undefined ? options.startRoleCode : initial.roleCode;
  let status: RequestStatus = "PENDING";
  const autoApprovedSteps: { stepOrder: number; roleCode: RoleCode }[] = [];

  if (user.roleCode === "HOD" && options.category === "ACADEMIC") {
    while (currentRoleCode === "HOD") {
      autoApprovedSteps.push({ stepOrder: currentStep, roleCode: currentRoleCode });
      const next = getNextStep(workflowSteps, currentStep);
      if (!next) {
        const last = workflowSteps[workflowSteps.length - 1];
        currentStep = last?.stepOrder ?? currentStep;
        currentRoleCode = null;
        status = "COMPLETED";
        break;
      }
      currentStep = next.stepOrder;
      currentRoleCode = next.roleCode;
    }
  }

  return { currentStep, currentRoleCode, status, autoApprovedSteps };
}

async function recordAutoApprovedSteps(
  requestId: string,
  userId: string,
  steps: { stepOrder: number; roleCode: RoleCode }[]
) {
  if (steps.length === 0) return;

  await prisma.approvalHistory.createMany({
    data: steps.map((step) => ({
      requestId,
      stepOrder: step.stepOrder,
      roleCode: step.roleCode,
      action: "APPROVE",
      actorId: userId,
      newStatus: "FORWARDED" as RequestStatus,
      remarks: "Auto-approved (request raised by HOD)",
    })),
  });
}

async function notifyRequestCompleted(raisedById: string, requestNumber: string, requestId: string) {
  await createNotification({
    userId: raisedById,
    type: "REQUEST_COMPLETED",
    title: "Request verified",
    message: `${requestNumber} completed all approvals. Download your approval PDF from the request page.`,
    link: `/requests/${requestId}`,
  });
}

async function notifyNextApproverAfterSubmit(
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
  title: string
) {
  const link = `/requests/${request.id}`;
  const message = `${request.requestNumber}: ${request.title}`;

  if (request.category === "CLUB" && request.clubId) {
    await notifyClubAuthority(request.clubId, { title, message, link });
  } else if (currentRoleCode === "HOD") {
    await notifyApprovers({
      roleCode: "HOD",
      departmentId,
      title,
      message,
      link,
      excludeUserId: user.id,
    });
  } else if (currentRoleCode) {
    await notifyApprovers({
      roleCode: currentRoleCode,
      title,
      message,
      link,
      excludeUserId: user.id,
    });
  }
}

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

  const [department, academicSection, club] = await Promise.all([
    prisma.department.findUniqueOrThrow({ where: { id: departmentId } }),
    data.academicSectionId
      ? prisma.academicSectionMaster.findUnique({ where: { id: data.academicSectionId } })
      : null,
    data.clubId ? prisma.club.findUnique({ where: { id: data.clubId } }) : null,
  ]);

  const requestNumber = await generateRequestNumber({
    category: data.category,
    departmentCode: department.code,
    academicSectionCode: academicSection?.code,
    clubCode: club?.code,
  });
  let currentStep = 0;
  let currentRoleCode: RoleCode | null = null;
  let status: RequestStatus = "DRAFT";

  let workflowStepsForCreate = null;
  let submitPosition: SubmitWorkflowPosition | null = null;

  if (data.submit) {
    workflowStepsForCreate = await resolveWorkflowForNewRequest({
      category: data.category,
      requestTypeId: data.requestTypeId,
      academicSectionId: data.category === "ACADEMIC" ? data.academicSectionId : null,
      clubId: data.category === "CLUB" ? data.clubId : null,
    });
    submitPosition = resolveSubmitWorkflowPosition(user, workflowStepsForCreate, {
      category: data.category,
    });
    currentStep = submitPosition.currentStep;
    currentRoleCode = submitPosition.currentRoleCode;
    status = submitPosition.status;
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
      completedAt: submitPosition?.status === "COMPLETED" ? new Date() : null,
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

    if (submitPosition) {
      await recordAutoApprovedSteps(request.id, user.id, submitPosition.autoApprovedSteps);
    }

    if (submitPosition?.status === "COMPLETED") {
      await notifyRequestCompleted(user.id, request.requestNumber, request.id);
    }

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
  const submitPosition = resolveSubmitWorkflowPosition(user, workflowStepsForCreate, {
    category: request.category,
  });

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: {
      status: submitPosition.status,
      currentStep: submitPosition.currentStep,
      currentRoleCode: submitPosition.currentRoleCode,
      workflowPath: serializeWorkflowPath(workflowStepsForCreate) as unknown as Prisma.InputJsonValue,
      submittedAt: new Date(),
      completedAt: submitPosition.status === "COMPLETED" ? new Date() : null,
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

  await recordAutoApprovedSteps(updated.id, user.id, submitPosition.autoApprovedSteps);

  if (submitPosition.status === "COMPLETED") {
    await notifyRequestCompleted(user.id, updated.requestNumber, updated.id);
  }

  await notifyAfterRequestSubmit(
    user,
    updated,
    updated.departmentId,
    submitPosition.currentRoleCode,
    submitPosition.currentStep
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

type RequestUpdatePayload = {
  title?: string;
  description?: string;
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
};

export async function updateRequest(
  user: SessionUser,
  requestId: string,
  data: RequestUpdatePayload
) {
  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Request not found");
  if (request.raisedById !== user.id) throw new Error("Only the request owner can edit");
  if (!["DRAFT", "RESEND"].includes(request.status)) {
    throw new Error("This request cannot be edited in its current status");
  }

  return prisma.request.update({
    where: { id: requestId },
    data: {
      title: data.title,
      description: data.description,
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
    },
  });
}

export async function resubmitAfterResend(user: SessionUser, requestId: string) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { department: true, raisedBy: true, club: true },
  });

  if (!request) throw new Error("Request not found");
  if (request.raisedById !== user.id) throw new Error("Only the request owner can resubmit");
  if (request.status !== "RESEND") throw new Error("Only requests sent for recheck can be resubmitted");

  const lastResend = await prisma.approvalHistory.findFirst({
    where: { requestId, action: "RESEND" },
    orderBy: { createdAt: "desc" },
    select: { stepOrder: true, roleCode: true },
  });

  if (!lastResend) {
    throw new Error("Cannot determine which authority to return to");
  }

  const returnRole = lastResend.roleCode;
  const returnStep = lastResend.stepOrder;

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

  const workflowSteps = await getWorkflowStepsForRequest(request);
  const submitPosition = resolveSubmitWorkflowPosition(user, workflowSteps, {
    category: request.category,
    startStep: returnStep,
    startRoleCode: returnRole,
  });

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: {
      status: submitPosition.status,
      currentRoleCode: submitPosition.currentRoleCode,
      currentStep: submitPosition.currentStep,
      completedAt: submitPosition.status === "COMPLETED" ? new Date() : null,
    },
  });

  await prisma.approvalHistory.create({
    data: {
      requestId,
      stepOrder: returnStep,
      roleCode: user.roleCode,
      action: "SUBMIT",
      actorId: user.id,
      previousStatus: "RESEND",
      newStatus: "PENDING",
      remarks: "Request updated and resubmitted after recheck",
    },
  });

  await recordAutoApprovedSteps(requestId, user.id, submitPosition.autoApprovedSteps);

  const link = `/requests/${requestId}`;
  const message = `${request.requestNumber}: ${request.title}`;

  if (submitPosition.status === "COMPLETED") {
    await notifyRequestCompleted(user.id, request.requestNumber, requestId);
  } else {
    await notifyNextApproverAfterSubmit(
      user,
      request,
      request.departmentId,
      submitPosition.currentRoleCode,
      "Request resubmitted after recheck"
    );
  }

  const advancedPastHod =
    returnRole === "HOD" &&
    user.roleCode === "HOD" &&
    submitPosition.autoApprovedSteps.length > 0;

  await createNotification({
    userId: user.id,
    type: "REQUEST_SUBMITTED",
    title: "Request resubmitted",
    message: advancedPastHod
      ? `Your request ${request.requestNumber} was updated and forwarded to the next approver.`
      : `Your request ${request.requestNumber} was sent back to ${returnRole} for review.`,
    link,
  });

  await createAuditLog({
    userId: user.id,
    action: "REQUEST_RESUBMIT",
    entityType: "Request",
    entityId: requestId,
    newValue: {
      status: submitPosition.status,
      returnRole,
      returnStep,
      currentRoleCode: submitPosition.currentRoleCode,
    },
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
    include: { raisedBy: { include: { role: true } }, department: true },
  });

  if (!request) throw new Error("Request not found");

  const userClubIds =
    user.roleCode === "CLUB_AUTHORITY" ? await getUserClubIds(user.id) : undefined;

  if (!canViewRequest(user, requestViewContext(request), userClubIds)) throw new Error("Access denied");

  if (!canApproveRequests(user)) {
    throw new Error("You are not authorized to approve requests");
  }

  if (request.status === "RESEND") {
    throw new Error(
      "This request was sent back for corrections. The faculty must edit and resubmit before you can act."
    );
  }

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
    // Route back to the raiser; return authority/step are stored on this RESEND history row.
    newRoleCode = null;
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

function buildStageRoleWhere(
  stageRole: RoleCode,
  stageOutcome?: "accepted" | "pending" | "rejected" | "resend"
): Prisma.RequestWhereInput {
  const pendingAtRole: Prisma.RequestWhereInput = {
    currentRoleCode: stageRole,
    status: { in: ["PENDING", "UNDER_REVIEW", "FORWARDED"] },
  };
  const resendAtRole: Prisma.RequestWhereInput = {
    currentRoleCode: stageRole,
    status: "RESEND",
  };
  const acceptedAtRole: Prisma.RequestWhereInput = {
    approvalHistory: { some: { roleCode: stageRole, action: "APPROVE" } },
  };
  const rejectedAtRole: Prisma.RequestWhereInput = {
    approvalHistory: { some: { roleCode: stageRole, action: "REJECT" } },
  };

  switch (stageOutcome) {
    case "accepted":
      return acceptedAtRole;
    case "rejected":
      return rejectedAtRole;
    case "pending":
      return pendingAtRole;
    case "resend":
      return resendAtRole;
    default:
      return { OR: [acceptedAtRole, rejectedAtRole, pendingAtRole, resendAtRole] };
  }
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
    stageRole?: RoleCode;
    stageOutcome?: "accepted" | "pending" | "rejected" | "resend";
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
    if (!filters?.mine) {
      Object.assign(where, hodFacultyQueueWhere(user.departmentId));
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
      where.status = { in: ["PENDING", "UNDER_REVIEW", "FORWARDED"] };
    }
  } else if (["IQAC", "PMSEB", "HR", "COE"].includes(user.roleCode)) {
    if (filters?.pendingForMe) {
      where.currentRoleCode = user.roleCode;
      where.status = { in: ["PENDING", "UNDER_REVIEW", "FORWARDED"] };
    }
  } else if (["REGISTRAR", "OFC"].includes(user.roleCode)) {
    if (filters?.pendingForMe) {
      where.currentRoleCode = user.roleCode;
      where.status = { in: ["PENDING", "UNDER_REVIEW", "FORWARDED"] };
    }
  }

  if (filters?.status) where.status = filters.status;
  if (filters?.statusIn?.length) where.status = { in: filters.statusIn };
  if (filters?.category) where.category = filters.category;
  if (filters?.departmentId) where.departmentId = filters.departmentId;
  if (filters?.academicSectionId) where.academicSectionId = filters.academicSectionId;
  if (filters?.clubId) where.clubId = filters.clubId;
  if (!filters?.stageRole && filters?.currentRoleCode) {
    where.currentRoleCode = filters.currentRoleCode;
  }

  const andConditions: Prisma.RequestWhereInput[] = [where];

  if (filters?.stageRole) {
    andConditions.push(buildStageRoleWhere(filters.stageRole, filters.stageOutcome));
  }
  if (filters?.search) {
    andConditions.push({
      OR: [
        { title: { contains: filters.search } },
        { requestNumber: { contains: filters.search } },
      ],
    });
  }

  andConditions.push(draftVisibilityWhere(user.id));

  if (andConditions.length === 1) return andConditions[0];
  return { AND: andConditions };
}
