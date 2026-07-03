"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { FacultySearchPicker, type FacultyOption } from "@/components/authorities/faculty-search-picker";
import { ROLE_LABELS } from "@/lib/constants";
import type { RoleCode } from "@prisma/client";

interface Mapping {
  id: string;
  roleCode: RoleCode;
  assignmentType: string;
  departmentId: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: { name: string };
  };
}

function cleanDisplayName(value: string): string {
  return value.replace(/_x000D_/gi, " ").replace(/\s+/g, " ").trim();
}

export function AuthorityManager() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyOption | null>(null);
  const [form, setForm] = useState({
    roleCode: "IQAC" as RoleCode,
    userId: "",
    reason: "",
  });

  async function load() {
    const authRes = await fetch("/api/authorities");
    const auth = await authRes.json();
    if (auth.success) setMappings(auth.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function assignUniversity(e: React.FormEvent) {
    e.preventDefault();
    if (!form.userId) return alert("Search and select a faculty member");

    setLoading(true);
    const res = await fetch("/api/authorities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roleCode: form.roleCode,
        userId: form.userId,
        assignmentType: "PERMANENT",
        reason: form.reason || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      setForm((prev) => ({ ...prev, userId: "", reason: "" }));
      setSelectedFaculty(null);
      load();
      alert("Role assigned — user can log in with their email");
    } else {
      alert(data.error ?? "Failed");
    }
  }

  const activeByRole = (role: RoleCode) =>
    mappings.filter((m) => m.roleCode === role && !m.departmentId);

  return (
    <div className="space-y-8">
      <form onSubmit={assignUniversity} className="nfa-card space-y-4">
        <h3 className="font-semibold text-slate-900">University-wide approval roles</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="nfa-label">Role *</label>
            <select
              className="nfa-input"
              value={form.roleCode}
              onChange={(e) =>
                setForm({
                  ...form,
                  roleCode: e.target.value as RoleCode,
                  userId: "",
                })
              }
            >
              {(["IQAC", "PMSEB", "HR", "COE"] as RoleCode[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="nfa-label">Assign to *</label>
            <FacultySearchPicker
              value={form.userId}
              selectedUser={selectedFaculty}
              onChange={(userId) => {
                setForm({ ...form, userId });
                if (!userId) setSelectedFaculty(null);
              }}
              onSelectUser={setSelectedFaculty}
              placeholder="Search faculty by name, email, or ID"
              required
            />
            <p className="mt-1 text-xs text-slate-500">Type at least 2 characters to search.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="nfa-label">Reason (optional)</label>
            <input
              className="nfa-input"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>
        </div>
        <button type="submit" className="nfa-btn-primary" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save Assignment
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(["IQAC", "PMSEB", "HR", "COE"] as RoleCode[]).map((role) => (
          <div key={role} className="nfa-card">
            <p className="text-sm font-medium text-slate-500">{ROLE_LABELS[role]}</p>
            {activeByRole(role)[0] ? (
              <>
                <p className="mt-1 font-semibold text-slate-900">
                  {cleanDisplayName(activeByRole(role)[0].user.firstName)}{" "}
                  {cleanDisplayName(activeByRole(role)[0].user.lastName)}
                </p>
                <p className="text-xs text-slate-500">{activeByRole(role)[0].user.email}</p>
              </>
            ) : (
              <p className="mt-1 text-sm text-amber-600">Not assigned</p>
            )}
          </div>
        ))}
      </div>

      <div className="nfa-card overflow-hidden p-0">
        <div className="border-b border-nfa-border px-6 py-3">
          <h3 className="font-semibold text-slate-900">All active role assignments</h3>
        </div>
        <table className="nfa-table w-full">
          <thead className="bg-slate-50">
            <tr>
              <th>Role</th>
              <th>Assigned To</th>
              <th>Department</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((m) => (
              <tr key={m.id}>
                <td className="font-medium">{ROLE_LABELS[m.roleCode]}</td>
                <td>
                  {cleanDisplayName(m.user.firstName)} {cleanDisplayName(m.user.lastName)}
                  <p className="text-xs text-slate-500">{m.user.email}</p>
                </td>
                <td>{m.user.department?.name ?? (m.departmentId ? "Dept-specific" : "University-wide")}</td>
                <td>
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">
                    {m.assignmentType}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
