import { ROLE_LABELS } from "@/lib/constants";
import type { SessionUser } from "@/types";

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-nfa-border/70 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900 sm:text-right">{value?.trim() || "—"}</dd>
    </div>
  );
}

export function ProfileDetails({ user }: { user: SessionUser }) {
  const fullName = `${user.firstName} ${user.lastName}`.trim();

  return (
    <section className="nfa-card">
      <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
      <p className="mt-1 text-sm text-slate-600">Your account information from the university directory.</p>

      <dl className="mt-4 divide-y divide-nfa-border/70">
        <DetailRow label="Full name" value={fullName} />
        <DetailRow label="Email" value={user.email} />
        <DetailRow label="Employee ID" value={user.employeeId} />
        <DetailRow label="Role" value={ROLE_LABELS[user.roleCode] ?? user.roleName} />
        <DetailRow label="Department" value={user.departmentName} />
        <DetailRow label="Department code" value={user.departmentCode} />
        <DetailRow label="Designation" value={user.designationName} />
        <DetailRow label="Position" value={user.positionName} />
      </dl>
    </section>
  );
}
