"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { ROLE_LABELS } from "@/lib/constants";
import { UserEditDrawer } from "@/components/users/user-edit-drawer";
import type { RoleCode } from "@prisma/client";
import type { SessionUser } from "@/types";

interface UserRow {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  loginPassword?: string | null;
  department?: { name: string; code: string } | null;
  designation?: { name: string; code: string } | null;
  position?: { name: string; code: string } | null;
  role: { code: RoleCode; name: string };
}

function displayName(firstName: string, lastName: string) {
  const first = firstName.trim();
  const last = lastName.trim();
  if (!last || last.toLowerCase() === first.toLowerCase()) return first || "—";
  return `${first} ${last}`;
}

export function FacultyRoster({
  viewer,
  allowDelete = false,
  allowEdit = false,
}: {
  viewer?: SessionUser | null;
  allowDelete?: boolean;
  allowEdit?: boolean;
}) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const showActions = allowDelete || allowEdit;

  async function loadUsers() {
    const res = await fetch("/api/users");
    const d = await res.json();
    if (d.success) setUsers(d.data);
    setLoading(false);
  }

  async function migratePasswords() {
    setMigrating(true);
    try {
      const res = await fetch("/api/users/migrate-passwords", { method: "POST" });
      const data = await res.json();
      if (!data.success) {
        alert(data.error ?? "Password migration failed");
        return;
      }
      alert(
        `Passwords updated.\nScanned: ${data.data.scanned}\nUpdated: ${data.data.updated}\nAlready OK: ${data.data.skipped}`
      );
      await loadUsers();
    } catch {
      alert("Password migration failed");
    } finally {
      setMigrating(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function deleteUser(user: UserRow) {
    const confirmed = window.confirm(
      `Delete ${displayName(user.firstName, user.lastName)} (${user.email})?\n\nThey will be deactivated and cannot log in.`
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
    return (
      <div className="nfa-card flex items-center justify-center gap-2 py-10 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-nfa-primary" />
        Loading staff…
      </div>
    );
  }

  const scopeLabel =
    viewer?.roleCode === "HOD" && viewer.departmentName
      ? `${viewer.departmentName} — faculty and staff in your department`
      : "All active staff grouped by department";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{scopeLabel}</p>
        {allowEdit && (
          <button
            type="button"
            className="nfa-btn-secondary text-xs"
            disabled={migrating}
            onClick={migratePasswords}
          >
            {migrating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Updating passwords…
              </>
            ) : (
              "Reset defaults to Faculty ID"
            )}
          </button>
        )}
      </div>
      {byDepartment.length === 0 ? (
        <div className="nfa-card py-10 text-center text-slate-500">No staff found</div>
      ) : (
        byDepartment.map(([dept, members]) => (
          <div key={dept} className="nfa-card overflow-hidden p-0">
            <div className="border-b border-nfa-border bg-slate-50 px-6 py-3">
              <h3 className="font-semibold text-slate-900">{dept}</h3>
              <p className="text-xs text-slate-500">{members.length} member(s)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="nfa-table w-full min-w-[980px]">
                <thead className="bg-white">
                  <tr>
                    <th className="whitespace-nowrap">Name</th>
                    <th className="whitespace-nowrap">Email</th>
                    <th className="whitespace-nowrap">Designation</th>
                    <th className="whitespace-nowrap">Position</th>
                    <th className="whitespace-nowrap">Login role</th>
                    {allowEdit && <th className="whitespace-nowrap">Password</th>}
                    {showActions && (
                      <th className="sticky right-0 z-10 w-40 whitespace-nowrap bg-white shadow-[-8px_0_12px_-8px_rgba(15,23,42,0.18)]">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {members.map((u) => (
                    <tr key={u.id}>
                      <td className="min-w-[140px] font-medium">
                        {displayName(u.firstName, u.lastName)}
                        <p className="text-xs font-normal text-slate-500">{u.employeeId}</p>
                      </td>
                      <td className="max-w-[220px] truncate text-slate-600" title={u.email}>
                        {u.email}
                      </td>
                      <td className="whitespace-nowrap text-slate-600">
                        {u.designation?.name ?? "—"}
                      </td>
                      <td className="whitespace-nowrap text-slate-600">
                        {u.position?.name ?? "—"}
                      </td>
                      <td className="whitespace-nowrap">
                        <span className="rounded-full bg-nfa-primary/10 px-2.5 py-0.5 text-xs font-medium text-nfa-primary">
                          {ROLE_LABELS[u.role.code] ?? u.role.name}
                        </span>
                      </td>
                      {allowEdit && (
                        <td className="whitespace-nowrap">
                          {u.loginPassword ? (
                            <code className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                              {u.loginPassword}
                            </code>
                          ) : (
                            <span className="text-xs text-amber-700">Changed — open Edit</span>
                          )}
                        </td>
                      )}
                      {showActions && (
                        <td className="sticky right-0 z-10 bg-white shadow-[-8px_0_12px_-8px_rgba(15,23,42,0.12)]">
                          <div className="flex flex-nowrap gap-1">
                            {allowEdit && (
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-nfa-primary hover:bg-nfa-primary/10"
                                onClick={() => setEditingUserId(u.id)}
                                title="Edit user / set password"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </button>
                            )}
                            {allowDelete && (
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
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      <UserEditDrawer
        userId={editingUserId}
        onClose={() => setEditingUserId(null)}
        onSaved={loadUsers}
      />
    </div>
  );
}
