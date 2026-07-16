import type { RoleCode } from "@prisma/client";

export interface WorkflowPathStep {
  stepOrder: number;
  roleCode: RoleCode;
  stepLabel: string;
}

export type WorkflowPathJson = WorkflowPathStep[];
