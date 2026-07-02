import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { FacultyRoster } from "@/components/authorities/faculty-roster";

export default async function DepartmentStaffPage() {
  const user = await requireUser();
  if (user.roleCode !== "HOD" && user.roleCode !== "REGISTRAR" && user.roleCode !== "OFC" && user.roleCode !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Department Staff</h2>
        <p className="text-slate-500">
          {user.departmentName
            ? `Faculty and staff in ${user.departmentName}`
            : "Faculty grouped by department"}
        </p>
      </div>
      <FacultyRoster viewer={user} />
    </div>
  );
}
