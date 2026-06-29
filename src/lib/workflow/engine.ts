import type { RoleCode, RequestStatus } from "@prisma/client";
import type { WorkflowPathStep } from "@/lib/workflow/types";
import { OFC_FINAL_CLEARANCE_LABEL } from "@/lib/constants";

export interface WorkflowStep {
  stepOrder: number;
  roleCode: RoleCode;
  stepLabel: string;
}

export interface TimelineStepResult {
  stepOrder: number;
  roleCode: RoleCode | null;
  stepLabel: string;
  status: "completed" | "current" | "pending" | "rejected" | "skipped";
  actorName?: string;
  remarks?: string;
  completedAt?: string;
  hideRoleLabel?: boolean;
}

const FINAL_CLEARANCE_LABEL = OFC_FINAL_CLEARANCE_LABEL;
const VERIFIED_LABEL = "Verified";

export function getNextStep(
  steps: WorkflowPathStep[],
  currentStep: number
): WorkflowPathStep | null {
  return steps.find((s) => s.stepOrder === currentStep + 1) ?? null;
}

export function getCurrentWorkflowStep(
  steps: WorkflowPathStep[],
  currentStep: number
): WorkflowPathStep | null {
  return steps.find((s) => s.stepOrder === currentStep) ?? null;
}

export function getInitialStep(steps: WorkflowPathStep[]): { step: number; roleCode: RoleCode } {
  const first = steps[0];
  if (!first) {
    throw new Error("Workflow path must contain at least one step");
  }
  return { step: first.stepOrder, roleCode: first.roleCode };
}

export function getStatusAfterAction(
  action: "APPROVE" | "REJECT" | "RESEND" | "FORWARD",
  isLastStep: boolean
): RequestStatus {
  switch (action) {
    case "APPROVE":
      return isLastStep ? "COMPLETED" : "FORWARDED";
    case "REJECT":
      return "REJECTED";
    case "RESEND":
      return "RESEND";
    case "FORWARD":
      return "FORWARDED";
    default:
      return "PENDING";
  }
}

function buildVisibleStepTimeline(
  steps: WorkflowPathStep[],
  currentStep: number,
  status: RequestStatus,
  history: {
    stepOrder: number;
    roleCode: RoleCode;
    action: string;
    actorName: string;
    remarks?: string | null;
    createdAt: Date;
  }[]
): TimelineStepResult[] {
  const visibleSteps = steps.filter((s) => s.roleCode !== "OFC");
  const rejected = status === "REJECTED";
  const resend = status === "RESEND";

  return visibleSteps.map((step) => {
    const record = history.find(
      (h) => h.stepOrder === step.stepOrder && h.roleCode === step.roleCode
    );

    if (record) {
      const isReject = record.action === "REJECT";
      return {
        ...step,
        status: isReject ? "rejected" : "completed",
        actorName: record.actorName,
        remarks: record.remarks ?? undefined,
        completedAt: record.createdAt.toISOString(),
      };
    }

    if (step.stepOrder < currentStep) {
      return { ...step, status: "completed" as const };
    }
    if (step.stepOrder === currentStep) {
      if (rejected) return { ...step, status: "rejected" as const };
      if (resend) return { ...step, status: "current" as const };
      if (status === "COMPLETED" && step.stepOrder <= currentStep) {
        return { ...step, status: "completed" as const };
      }
      return { ...step, status: "current" as const };
    }
    return { ...step, status: "pending" as const };
  });
}

function buildFinalClearanceStep(
  steps: WorkflowPathStep[],
  currentStep: number,
  status: RequestStatus,
  history: {
    stepOrder: number;
    roleCode: RoleCode;
    action: string;
    actorName: string;
    remarks?: string | null;
    createdAt: Date;
  }[]
): TimelineStepResult {
  const ofcStep = steps.find((s) => s.roleCode === "OFC");
  const ofcRecord = history.find((h) => h.roleCode === "OFC");
  const maxVisibleOrder = Math.max(
    ...steps.filter((s) => s.roleCode !== "OFC").map((s) => s.stepOrder),
    0
  );

  if (ofcRecord?.action === "APPROVE" || status === "COMPLETED") {
    return {
      stepOrder: maxVisibleOrder + 1,
      roleCode: null,
      stepLabel: VERIFIED_LABEL,
      status: "completed",
      actorName: ofcRecord?.actorName,
      remarks: ofcRecord?.remarks ?? undefined,
      completedAt: ofcRecord?.createdAt.toISOString(),
      hideRoleLabel: true,
    };
  }

  if (
    ofcRecord?.action === "REJECT" ||
    (status === "REJECTED" && currentStep === ofcStep?.stepOrder)
  ) {
    return {
      stepOrder: maxVisibleOrder + 1,
      roleCode: null,
      stepLabel: FINAL_CLEARANCE_LABEL,
      status: "rejected",
      actorName: ofcRecord?.actorName,
      remarks: ofcRecord?.remarks ?? undefined,
      completedAt: ofcRecord?.createdAt.toISOString(),
      hideRoleLabel: true,
    };
  }

  const atFinalClearance =
    ofcStep &&
    currentStep >= ofcStep.stepOrder &&
    !["REJECTED", "DRAFT"].includes(status);

  return {
    stepOrder: maxVisibleOrder + 1,
    roleCode: null,
    stepLabel: FINAL_CLEARANCE_LABEL,
    status: atFinalClearance ? "current" : "pending",
    hideRoleLabel: true,
  };
}

export function buildTimeline(
  steps: WorkflowPathStep[],
  currentStep: number,
  status: RequestStatus,
  history: {
    stepOrder: number;
    roleCode: RoleCode;
    action: string;
    actorName: string;
    remarks?: string | null;
    createdAt: Date;
  }[]
): TimelineStepResult[] {
  const visibleTimeline = buildVisibleStepTimeline(steps, currentStep, status, history);
  const finalStep = buildFinalClearanceStep(steps, currentStep, status, history);
  return [...visibleTimeline, finalStep];
}

export function isAwaitingFinalClearance(
  status: RequestStatus,
  currentRoleCode: RoleCode | null
): boolean {
  return (
    currentRoleCode === "OFC" &&
    !["COMPLETED", "REJECTED", "DRAFT"].includes(status)
  );
}

export function isLastApprovalStep(
  steps: WorkflowPathStep[],
  currentStep: number
): boolean {
  return !getNextStep(steps, currentStep);
}
