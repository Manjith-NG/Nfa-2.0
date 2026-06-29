import { Suspense } from "react";
import Link from "next/link";
import type { RequestCategory, RequestStatus, RoleCode } from "@prisma/client";
import { getCurrentUser } from "@/lib/session";
import { hasPermission, isSuperAdmin } from "@/lib/rbac";
import { listRequestItems } from "@/lib/services/dashboard-service";
import { getAcademicSectionById } from "@/lib/services/academic-section-service";
import { RequestsSearch } from "@/components/requests/requests-search";
import { RequestsTable } from "@/components/requests/requests-table";
import { TableSkeleton } from "@/components/ui/page-skeleton";
import { ROLE_LABELS } from "@/lib/constants";

const PENDING_STATUSES: RequestStatus[] = ["PENDING", "UNDER_REVIEW", "FORWARDED", "RESEND"];

const FILTER_LABELS: Record<string, string> = {
  COMPLETED: "Verified requests",
  REJECTED: "Rejected requests",
  RESEND: "Recheck requests",
  CLUB: "Club requests",
  pending: "Pending requests",
};

async function RequestsList({
  search,
  mineOnly,
  status,
  statusIn,
  category,
  role,
  sectionId,
  clubId,
}: {
  search: string;
  mineOnly: boolean;
  status?: RequestStatus;
  statusIn?: RequestStatus[];
  category?: RequestCategory;
  role?: RoleCode;
  sectionId?: string;
  clubId?: string;
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
    currentRoleCode: role,
    academicSectionId: sectionId,
    clubId,
  });

  return <RequestsTable items={items} />;
}

export default function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{
    mine?: string;
    search?: string;
    status?: string;
    category?: string;
    pending?: string;
    role?: string;
    section?: string;
    sectionId?: string;
    clubId?: string;
  }>;
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
  searchParams: Promise<{
    mine?: string;
    search?: string;
    status?: string;
    category?: string;
    pending?: string;
    role?: string;
    section?: string;
    sectionId?: string;
    clubId?: string;
  }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const search = params.search ?? "";
  const mineOnly = params.mine === "true";
  const pending = params.pending === "1";
  const status = params.status as RequestStatus | undefined;
  const category = params.category as RequestCategory | undefined;
  const role = params.role as RoleCode | undefined;
  const sectionId = params.sectionId ?? params.section;
  const clubId = params.clubId;
  const statusIn = pending ? PENDING_STATUSES : undefined;

  let title = mineOnly ? "My Requests" : isSuperAdmin(user?.roleCode ?? "FACULTY") ? "All Requests" : "My Requests";
  if (user?.roleCode === "CLUB_AUTHORITY" && !mineOnly && !status && !category && !pending) {
    title = "Club Requests";
  }
  if (status === "COMPLETED") title = FILTER_LABELS.COMPLETED;
  else if (status === "REJECTED") title = FILTER_LABELS.REJECTED;
  else if (status === "RESEND") title = FILTER_LABELS.RESEND;
  else if (category === "CLUB") title = FILTER_LABELS.CLUB;
  else if (pending) title = FILTER_LABELS.pending;
  else if (role) title = `${ROLE_LABELS[role] ?? role} queue`;
  else if (sectionId) {
    const sectionRecord = await getAcademicSectionById(sectionId);
    title = sectionRecord ? `${sectionRecord.name} requests` : "Section requests";
  }

  const canCreate = user ? hasPermission(user, "request:create") : false;

  return (
    <RequestsPageShell search={search} mineOnly={mineOnly} title={title} canCreate={canCreate}>
      <Suspense
        key={`${search}-${mineOnly}-${status ?? ""}-${category ?? ""}-${pending}-${role ?? ""}-${sectionId ?? ""}-${clubId ?? ""}`}
        fallback={<TableSkeleton rows={10} />}
      >
        <RequestsList
          search={search}
          mineOnly={mineOnly}
          status={pending ? undefined : status}
          statusIn={statusIn}
          category={category}
          role={role}
          sectionId={sectionId}
          clubId={clubId}
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
  children,
}: {
  search: string;
  mineOnly: boolean;
  title: string;
  canCreate: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          <p className="text-slate-500">
            {canCreate ? "Track all your submitted requests" : "Browse and review university requests"}
          </p>
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
