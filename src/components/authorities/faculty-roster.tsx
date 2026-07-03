"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
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

export function FacultyRoster({
  viewer,
  allowDelete = false,
}: {
  viewer?: SessionUser | null;
  allowDelete?: boolean;
}) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadUsers() {
    const res = await fetch("/api/users");
    const d = await res.json();
    if (d.success) setUsers(d.data);
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function deleteUser(user: UserRow) {
    const confirmed = window.confirm(
      `Delete ${user.firstName} ${user.lastName} (${user.email})?\n\nThey will be deactivated and cannot log in.`
    );
    if (!confirmed) return;

    setDeletingId(user.id);
    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    const data = await res.json();
    setDeletingId(null);

    if (data.success) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } else {
      alert(data.error ?? "Failed to delete user");
    }
  }

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
                  {allowDelete && <th className="w-24">Actions</th>}
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
                    {allowDelete && (
                      <td>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          onClick={() => deleteUser(u)}
                          disabled={deletingId === u.id}
                          title="Deactivate user"
                        >
                          {deletingId === u.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Delete
                        </button>
                      </td>
                    )}
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
