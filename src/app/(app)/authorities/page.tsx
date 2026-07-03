import { requireUser } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { StaffRolesHub } from "@/components/authorities/staff-roles-hub";

export default async function AuthoritiesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireUser();
  if (!hasPermission(user, "authorities:manage")) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const tab = params.tab;
  const initialTab =
    tab === "clubs" || tab === "university" || tab === "roster" ? tab : "university";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Staff & Role Assignments</h2>
        <p className="text-slate-500">
          Assign university approvers (IQAC, PMSEB, HR, COE), club authorities, and view faculty by
          department. Each person logs in with their email.
        </p>
      </div>
      <StaffRolesHub initialTab={initialTab} />
    </div>
  );
}
