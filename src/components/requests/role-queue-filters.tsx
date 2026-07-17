"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RequestCategory, RoleCode } from "@prisma/client";
import {
  buildRoleQueueFilterHref,
  stageOutcomeLabel,
  type StageOutcome,
} from "@/lib/role-queue-filters";

type DepartmentOption = { id: string; name: string; code: string };

const STAGE_OPTIONS: { value: StageOutcome | ""; label: string }[] = [
  { value: "", label: "All stages" },
  { value: "accepted", label: "Accepted" },
  { value: "pending", label: "Pending" },
  { value: "resend", label: "Recheck" },
  { value: "rejected", label: "Rejected" },
];

type RoleQueueFiltersProps = {
  stageRole: RoleCode;
  stageOutcome?: StageOutcome;
  category?: RequestCategory;
  sectionId?: string;
  clubId?: string;
  departmentId?: string;
  departments: DepartmentOption[];
  showDepartmentFilter?: boolean;
};

function buildScope(props: RoleQueueFiltersProps, departmentId?: string) {
  return {
    category: props.category,
    clubId: props.clubId,
    academicSectionId: props.sectionId,
    departmentId: departmentId || undefined,
  };
}

export function RoleQueueFilters(props: RoleQueueFiltersProps) {
  const { stageRole, stageOutcome, departmentId, departments, showDepartmentFilter = true } =
    props;
  const router = useRouter();

  const stageOptions = STAGE_OPTIONS.map((option) => ({
    ...option,
    label:
      option.value === "resend"
        ? stageOutcomeLabel("resend", stageRole)
        : option.label,
  }));

  function navigate(nextStage?: StageOutcome, nextDepartmentId?: string) {
    router.push(
      buildRoleQueueFilterHref(
        stageRole,
        nextStage,
        buildScope(props, nextDepartmentId ?? departmentId)
      )
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-end gap-3">
      <div className="min-w-[10rem]">
        <label htmlFor="stage-filter" className="mb-1 block text-xs font-medium text-slate-500">
          Stage
        </label>
        <select
          id="stage-filter"
          value={stageOutcome ?? ""}
          onChange={(e) => {
            const value = e.target.value as StageOutcome | "";
            navigate(value || undefined, departmentId);
          }}
          className="nfa-input w-full py-1.5 text-sm"
        >
          {stageOptions.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {showDepartmentFilter && departments.length > 0 && (
        <div className="min-w-[14rem]">
          <label
            htmlFor="department-filter"
            className="mb-1 block text-xs font-medium text-slate-500"
          >
            Department
          </label>
          <select
            id="department-filter"
            value={departmentId ?? ""}
            onChange={(e) => navigate(stageOutcome, e.target.value || undefined)}
            className="nfa-input w-full py-1.5 text-sm"
          >
            <option value="">All departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>
        </div>
      )}

      <Link
        href="/approvals/insight"
        className="pb-1.5 text-xs font-medium text-nfa-primary hover:underline"
      >
        Back to Role Queues
      </Link>
    </div>
  );
}
