import { prisma } from "@/lib/db";
import { canViewRequest, canApproveAtStep } from "@/lib/rbac";
import { getUserClubIds } from "@/lib/club-access";
import { buildTimeline, type TimelineStepResult } from "@/lib/workflow/engine";
import { getWorkflowStepsForRequest } from "@/lib/workflow/resolve";
import { fullName } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";
import { resendActionLabel } from "@/lib/workflow/timeline-labels";
import {
  canDownloadFullCertificate,
  canDownloadSummaryPdf,
} from "@/lib/services/request-export-service";
import type { SessionUser } from "@/types";
import type { RequestStatus, RequestCategory, RoleCode } from "@prisma/client";

export type RequestDetailData = {
  id: string;
  requestNumber: string;
  title: string;
  description: string | null;
  category: RequestCategory;
  status: RequestStatus;
  budgetAmount: string | null;
  budgetPurpose: string | null;
  eventDate: string | null;
  venue: string | null;
  briefNote: string | null;
  needForProposal: string | null;
  proposalDate: string | null;
  eventStartDate: string | null;
  eventEndDate: string | null;
  academicSectionLabel: string | null;
  raisedByName: string;
  department: { name: string; code: string };
  club: { name: string } | null;
  attachments: {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    createdAt: string;
  }[];
  canUploadAttachments: boolean;
  timeline: TimelineStepResult[];
  canApprove: boolean;
  canDownloadPdf?: boolean;
  canDownloadSummary?: boolean;
  canManageWorkflow?: boolean;
  canForward?: boolean;
  canEdit?: boolean;
  canResubmit?: boolean;
  resendInfo?: {
    roleCode: RoleCode;
    roleName: string;
    actionLabel: string;
    remarks?: string;
  } | null;
  workflowSteps?: { roleCode: RoleCode; stepLabel: string }[];
  currentRoleCode?: RoleCode | null;
  workflowNote?: string;
  raisedById?: string;
  remarks: {
    id: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      firstName: string;
      lastName: string;
      roleCode: RoleCode;
      roleName: string;
    };
  }[];
};

export async function getRequestDetailData(
  user: SessionUser,
  id: string
): Promise<RequestDetailData | null> {
  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      department: true,
      raisedBy: { include: { role: true } },
      club: true,
      academicSection: { select: { name: true } },
      remarks: {
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: { select: { code: true, name: true } },
            },
          },
        },
      },
      approvalHistory: {
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { firstName: true, lastName: true } } },
      },
      attachments: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          createdAt: true,
        },
      },
    },
  });

  if (!request) {
    return null;
  }

  const userClubIds =
    user.roleCode === "CLUB_AUTHORITY" ? await getUserClubIds(user.id) : undefined;

  if (!canViewRequest(user, request, userClubIds)) {
    return null;
  }

  const workflowSteps = await getWorkflowStepsForRequest(request);
  const timeline = buildTimeline(
    workflowSteps,
    request.currentStep,
    request.status,
    request.approvalHistory.map((h) => ({
      stepOrder: h.stepOrder,
      roleCode: h.roleCode,
      action: h.action,
      actorName: fullName(h.actor.firstName, h.actor.lastName),
      remarks: h.remarks,
      createdAt: h.createdAt,
    }))
  );

  const workflowLabels = workflowSteps
    .filter((s) => s.roleCode !== "OFC")
    .map((s) => s.stepLabel.replace(" Approval", ""))
    .join(" → ");

  const latestResend = [...request.approvalHistory]
    .reverse()
    .find((h) => h.action === "RESEND");

  const isOwner = request.raisedById === user.id;

  return {
    id: request.id,
    requestNumber: request.requestNumber,
    title: request.title,
    description: request.description,
    category: request.category,
    status: request.status,
    budgetAmount: request.budgetAmount?.toString() ?? null,
    budgetPurpose: request.budgetPurpose,
    eventDate: request.eventDate?.toISOString() ?? null,
    venue: request.venue,
    briefNote: request.briefNote,
    needForProposal: request.needForProposal,
    proposalDate: request.proposalDate?.toISOString() ?? null,
    eventStartDate: request.eventStartDate?.toISOString() ?? null,
    eventEndDate: request.eventEndDate?.toISOString() ?? null,
    academicSectionLabel: request.academicSection?.name ?? null,
    raisedByName: fullName(request.raisedBy.firstName, request.raisedBy.lastName),
    department: { name: request.department.name, code: request.department.code },
    club: request.club ? { name: request.club.name } : null,
    attachments: request.attachments.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      fileSize: a.fileSize,
      mimeType: a.mimeType,
      createdAt: a.createdAt.toISOString(),
    })),
    canUploadAttachments:
      request.raisedById === user.id && ["DRAFT", "RESEND"].includes(request.status),
    timeline,
    workflowSteps,
    currentRoleCode: request.currentRoleCode,
    raisedById: request.raisedById,
    canApprove:
      canApproveAtStep(user, request, userClubIds) &&
      ["PENDING", "UNDER_REVIEW", "FORWARDED"].includes(request.status),
    canEdit: isOwner && ["DRAFT", "RESEND"].includes(request.status),
    canResubmit: isOwner && request.status === "RESEND",
    resendInfo:
      request.status === "RESEND" && latestResend
        ? {
            roleCode: latestResend.roleCode,
            roleName: ROLE_LABELS[latestResend.roleCode] ?? latestResend.roleCode,
            actionLabel: resendActionLabel(latestResend.roleCode),
            remarks: latestResend.remarks ?? undefined,
          }
        : null,
    canManageWorkflow:
      user.roleCode === "REGISTRAR" &&
      ["PENDING", "DRAFT"].includes(request.status),
    canForward:
      user.roleCode === "REGISTRAR" &&
      request.currentRoleCode === "REGISTRAR" &&
      ["PENDING", "FORWARDED"].includes(request.status),
    canDownloadPdf: canDownloadFullCertificate(user, request),
    canDownloadSummary: canDownloadSummaryPdf(user, request),
    workflowNote: `Approval path: ${workflowLabels} → awaiting final clearance. Short Report PDF is available for review; Full Approval Certificate downloads after OFC verification (Verified status).`,
    remarks: request.remarks.map((r) => ({
      id: r.id,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
      author: {
        id: r.author.id,
        firstName: r.author.firstName,
        lastName: r.author.lastName,
        roleCode: r.author.role.code,
        roleName: ROLE_LABELS[r.author.role.code] ?? r.author.role.name,
      },
    })),
  };
}
