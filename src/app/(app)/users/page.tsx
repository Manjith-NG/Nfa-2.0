import Link from "next/link";
import { UserPlus, Users } from "lucide-react";
import { requireUser } from "@/lib/session";
import { canDeleteUsers, canEditUsers, hasPermission } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { FacultyRoster } from "@/components/authorities/faculty-roster";

export default async function UsersPage() {
  const user = await requireUser();
  if (!hasPermission(user, "users:manage")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">User Management</h2>
          <p className="text-slate-500">
            View all active staff and faculty. Add new faculty individually or via CSV template.
            {canEditUsers(user) || canDeleteUsers(user)
              ? " Developers can edit or deactivate accounts from this list."
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/faculty" className="nfa-btn-primary inline-flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add Faculty
          </Link>
          <Link href="/authorities" className="nfa-btn-secondary inline-flex items-center gap-2">
            <Users className="h-4 w-4" />
            Staff & Roles
          </Link>
        </div>
      </div>

      <FacultyRoster
        viewer={user}
        allowEdit={canEditUsers(user)}
        allowDelete={canDeleteUsers(user)}
      />
    </div>
  );
}
