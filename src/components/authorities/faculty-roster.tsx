"use client";

import { useEffect, useMemo, useState } from "react";
import { ROLE_LABELS } from "@/lib/constants";
import type { RoleCode } from "@prisma/client";
import type { SessionUser } from "@/types";

interface UserRow {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  department?: { name: string; code: string } | null;
  designation?: { name: string; code: string } | null;
  position?: { name: string; code: string } | null;
  role: { code: RoleCode; name: string };
}

export function FacultyRoster({ viewer }: { viewer?: SessionUser | null }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUsers(d.data);
        setLoading(false);
      });
  }, []);

  const byDepartment = useMemo(() => {
    const map = new Map<string, UserRow[]>();
    for (const u of users) {
      const key = u.department?.name ?? "No department";
      const list = map.get(key) ?? [];
      list.push(u);
      map.set(key, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [users]);

  if (loading) {
    return <div className="nfa-card py-10 text-center text-slate-500">Loading staff…</div>;
  }

  const scopeLabel =
    viewer?.roleCode === "HOD" && viewer.departmentName
      ? `${viewer.departmentName} — faculty and staff in your department`
      : "All active staff grouped by department";

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">{scopeLabel}</p>
      {byDepartment.length === 0 ? (
        <div className="nfa-card py-10 text-center text-slate-500">No staff found</div>
      ) : (
        byDepartment.map(([dept, members]) => (
          <div key={dept} className="nfa-card overflow-hidden p-0">
            <div className="border-b border-nfa-border bg-slate-50 px-6 py-3">
              <h3 className="font-semibold text-slate-900">{dept}</h3>
              <p className="text-xs text-slate-500">{members.length} member(s)</p>
            </div>
            <table className="nfa-table w-full">
              <thead className="bg-white">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Designation</th>
                  <th>Position</th>
                  <th>Login role</th>
                </tr>
              </thead>
              <tbody>
                {members.map((u) => (
                  <tr key={u.id}>
                    <td className="font-medium">
                      {u.firstName} {u.lastName}
                      <p className="text-xs font-normal text-slate-500">{u.employeeId}</p>
                    </td>
                    <td className="text-slate-600">{u.email}</td>
                    <td className="text-slate-600">{u.designation?.name ?? "—"}</td>
                    <td className="text-slate-600">{u.position?.name ?? "—"}</td>
                    <td>
                      <span className="rounded-full bg-nfa-primary/10 px-2.5 py-0.5 text-xs font-medium text-nfa-primary">
                        {ROLE_LABELS[u.role.code] ?? u.role.name}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
