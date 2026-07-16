import { Suspense } from "react";
import Link from "next/link";
import type { RequestCategory, RequestStatus, RoleCode } from "@prisma/client";
import { getCurrentUser } from "@/lib/session";
import { hasPermission, isSuperAdmin } from "@/lib/rbac";
import { listRequestItems } from "@/lib/services/dashboard-service";
import { getAcademicSectionById } from "@/lib/services/academic-section-service";
import { listActiveDepartments } from "@/lib/services/org-master-service";
import { RequestsSearch } from "@/components/requests/requests-search";
import { RequestsTable } from "@/components/requests/requests-table";
import { TableSkeleton } from "@/components/ui/page-skeleton";
import { ROLE_LABELS } from "@/lib/constants";
import { parseStageOutcome, stageOutcomeLabel } from "@/lib/role-queue-filters";

const PENDING_STATUSES: RequestStatus[] = ["PENDING", "UNDER_REVIEW", "FORWARDED"];

const FILTER_LABELS: Record<string, string> = {
  COMPLETED: "Verified requests",
  REJECTED: "Rejected requests",
  RESEND: "Recheck requests",
  CLUB: "Club requests",
  pending: "Pending requests",
};

type RequestSearchParams = {
  mine?: string;
  search?: string;
  status?: string;
  category?: string;
  pending?: string;
  role?: string;
  stage?: string;
  section?: string;
  sectionId?: string;
  clubId?: string;
  departmentId?: string;
};

async function RequestsList({
  search,
  mineOnly,
  status,
  statusIn,
  category,
  stageRole,
  stageOutcome,
  sectionId,
  clubId,
  departmentId,
}: {
  search: string;
  mineOnly: boolean;
  status?: RequestStatus;
  statusIn?: RequestStatus[];
  category?: RequestCategory;
  stageRole?: RoleCode;
  stageOutcome?: ReturnType<typeof parseStageOutcome>;
  sectionId?: string;
  clubId?: string;
  departmentId?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const items = await listRequestItems(user, {
    limit: 50,
    mine: mineOnly,
    search: search || undefined,
    status,
    statusIn,
    category,
    stageRole,
    stageOutcome,
    academicSectionId: sectionId,
    clubId,
    departmentId,
  });

  return <RequestsTable items={items} />;
}

export default function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<RequestSearchParams>;
}) {
  return (
    <Suspense fallback={<RequestsPageShell search="" mineOnly={false} title="Requests" canCreate={false} />}>
      <RequestsPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function RequestsPageContent({
  searchParams,
}: {
  searchParams: Promise<RequestSearchParams>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const search = params.search ?? "";
  const mineOnly = params.mine === "true";
  const pending = params.pending === "1";
  const status = params.status as RequestStatus | undefined;
  const category = params.category as RequestCategory | undefined;
  const stageRole = params.role as RoleCode | undefined;
  const stageOutcome = parseStageOutcome(params.stage);
  const sectionId = params.sectionId ?? params.section;
  const clubId = params.clubId;
  const departmentId = params.departmentId;
  const statusIn = pending ? PENDING_STATUSES : undefined;

  const showDepartmentFilters =
    stageRole === "HOD" && isSuperAdmin(user?.roleCode ?? "FACULTY");
  const departments = showDepartmentFilters ? await listActiveDepartments() : [];

  let title = mineOnly ? "My Requests" : isSuperAdmin(user?.roleCode ?? "FACULTY") ? "All Requests" : "My Requests";
  if (user?.roleCode === "CLUB_AUTHORITY" && !mineOnly && !status && !category && !pending && !stageRole) {
    title = "Club Requests";
  }
  if (stageRole) {
    const roleLabel = ROLE_LABELS[stageRole] ?? stageRole;
    title = stageOutcome
      ? `${roleLabel} — ${stageOutcomeLabel(stageOutcome, stageRole)}`
      : `${roleLabel} — all stages`;
    if (departmentId && stageRole === "HOD") {
      const dept = departments.find((d) => d.id === departmentId);
      if (dept) {
        title = stageOutcome
          ? `HOD (${dept.name}) — ${stageOutcomeLabel(stageOutcome, stageRole)}`
          : `HOD (${dept.name}) — all stages`;
      }
    }
  } else if (status === "COMPLETED") title = FILTER_LABELS.COMPLETED;
  else if (status === "REJECTED") title = FILTER_LABELS.REJECTED;
  else if (status === "RESEND") title = FILTER_LABELS.RESEND;
  else if (category === "CLUB") title = FILTER_LABELS.CLUB;
  else if (pending) title = FILTER_LABELS.pending;
  else if (sectionId) {
    const sectionRecord = await getAcademicSectionById(sectionId);
    title = sectionRecord ? `${sectionRecord.name} requests` : "Section requests";
  }

  const canCreate = user ? hasPermission(user, "request:create") : false;

  return (
    <RequestsPageShell
      search={search}
      mineOnly={mineOnly}
      title={title}
      canCreate={canCreate}
      stageRole={stageRole}
      stageOutcome={stageOutcome}
      category={category}
      sectionId={sectionId}
      clubId={clubId}
      departmentId={departmentId}
      showDepartmentFilters={showDepartmentFilters}
      departments={departments.map((d) => ({ id: d.id, name: d.name, code: d.code }))}
    >
      <Suspense
        key={`${search}-${mineOnly}-${status ?? ""}-${category ?? ""}-${pending}-${stageRole ?? ""}-${stageOutcome ?? ""}-${sectionId ?? ""}-${clubId ?? ""}-${departmentId ?? ""}`}
        fallback={<TableSkeleton rows={10} />}
      >
        <RequestsList
          search={search}
          mineOnly={mineOnly}
          status={pending ? undefined : status}
          statusIn={statusIn}
          category={category}
          stageRole={stageRole}
          stageOutcome={stageOutcome}
          sectionId={sectionId}
          clubId={clubId}
          departmentId={departmentId}
        />
      </Suspense>
    </RequestsPageShell>
  );
}

function RequestsPageShell({
  search,
  mineOnly,
  title,
  canCreate,
  stageRole,
  stageOutcome,
  category,
  sectionId,
  clubId,
  departmentId,
  showDepartmentFilters,
  departments,
  children,
}: {
  search: string;
  mineOnly: boolean;
  title: string;
  canCreate: boolean;
  stageRole?: RoleCode;
  stageOutcome?: ReturnType<typeof parseStageOutcome>;
  category?: RequestCategory;
  sectionId?: string;
  clubId?: string;
  departmentId?: string;
  showDepartmentFilters?: boolean;
  departments?: { id: string; name: string; code: string }[];
  children?: React.ReactNode;
}) {
  const hasStageFilters = Boolean(stageRole);
  const filterScope = { category, sectionId, clubId, departmentId };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          <p className="text-slate-500">
            {canCreate ? "Track all your submitted requests" : "Browse and review university requests"}
          </p>
          {hasStageFilters && stageRole && (
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <FilterChip
                  href={buildStageHref(stageRole, undefined, filterScope)}
                  active={!stageOutcome}
                  label="All"
                />
                <FilterChip
                  href={buildStageHref(stageRole, "accepted", filterScope)}
                  active={stageOutcome === "accepted"}
                  label="Accepted"
                />
                <FilterChip
                  href={buildStageHref(stageRole, "pending", filterScope)}
                  active={stageOutcome === "pending"}
                  label="Pending"
                />
                <FilterChip
                  href={buildStageHref(stageRole, "resend", filterScope)}
                  active={stageOutcome === "resend"}
                  label={stageOutcomeLabel("resend", stageRole)}
                />
                <FilterChip
                  href={buildStageHref(stageRole, "rejected", filterScope)}
                  active={stageOutcome === "rejected"}
                  label="Rejected"
                />
                <Link href="/approvals/insight" className="text-xs font-medium text-nfa-primary hover:underline">
                  Back to Role Queues
                </Link>
              </div>
              {showDepartmentFilters && departments && departments.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">Department:</span>
                  <FilterChip
                    href={buildStageHref(stageRole, stageOutcome, { category, sectionId, clubId })}
                    active={!departmentId}
                    label="All departments"
                  />
                  {departments.map((dept) => (
                    <FilterChip
                      key={dept.id}
                      href={buildStageHref(stageRole, stageOutcome, {
                        category,
                        sectionId,
                        clubId,
                        departmentId: dept.id,
                      })}
                      active={departmentId === dept.id}
                      label={dept.code}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {canCreate && (
          <Link href="/requests/new" className="nfa-btn-primary">
            Raise Request
          </Link>
        )}
      </div>

      <div className="nfa-card overflow-hidden p-0">
        <div className="border-b border-nfa-border p-4">
          <RequestsSearch defaultValue={search} />
        </div>
        <div className="p-0">{children ?? <TableSkeleton rows={10} />}</div>
      </div>
    </div>
  );
}

function buildStageHref(
  role: RoleCode,
  stage?: ReturnType<typeof parseStageOutcome>,
  scope?: {
    category?: RequestCategory;
    sectionId?: string;
    clubId?: string;
    departmentId?: string;
  }
) {
  const params = new URLSearchParams({ role });
  if (stage) params.set("stage", stage);
  if (scope?.category) params.set("category", scope.category);
  if (scope?.sectionId) params.set("sectionId", scope.sectionId);
  if (scope?.clubId) params.set("clubId", scope.clubId);
  if (scope?.departmentId) params.set("departmentId", scope.departmentId);
  return `/requests?${params.toString()}`;
}

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-nfa-primary text-white"
          : "border border-nfa-border bg-white text-slate-600 hover:border-nfa-primary/40 hover:text-nfa-primary"
      }`}
    >
      {label}
    </Link>
  );
}
