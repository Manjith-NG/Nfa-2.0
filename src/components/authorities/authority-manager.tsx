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

interface Dept {
  id: string;
  name: string;
  code: string;
  hod?: { id: string; firstName: string; lastName: string } | null;
}

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

function cleanDisplayName(value: string): string {
  return value.replace(/_x000D_/gi, " ").replace(/\s+/g, " ").trim();
}

function hodPersonName(user: { firstName: string; lastName: string }): string {
  return `${cleanDisplayName(user.firstName)} ${cleanDisplayName(user.lastName)}`;
}

function confirmHodAssignment(dept: Dept, newUser: UserOption): boolean {
  const newName = hodPersonName(newUser);
  if (dept.hod?.id === newUser.id) {
    alert(`${newName} is already the HOD for ${dept.name}.`);
    return false;
  }
  if (dept.hod) {
    const currentName = hodPersonName(dept.hod);
    return window.confirm(
      `${dept.name} already has HOD: ${currentName}.\n\nReplace with ${newName}?\n\nOnly one HOD is allowed per department. The previous HOD will be changed back to Faculty.`
    );
  }
  return window.confirm(`Assign ${newName} as HOD for ${dept.name}?`);
}

export function AuthorityManager({
  universityOnly = false,
  showUniversityRoles = true,
}: {
  universityOnly?: boolean;
  showUniversityRoles?: boolean;
}) {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [hodFaculty, setHodFaculty] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyOption | null>(null);
  const [form, setForm] = useState({
    roleCode: "IQAC" as RoleCode,
    userId: "",
    departmentId: "",
    reason: "",
  });

  async function load() {
    const [authRes, deptRes] = await Promise.all([
      fetch("/api/authorities"),
      fetch("/api/master/departments"),
    ]);
    const auth = await authRes.json();
    const dept = await deptRes.json();
    if (auth.success) setMappings(auth.data);
    if (dept.success) setDepartments(dept.data);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (universityOnly) return;
    if (!form.departmentId) {
      setHodFaculty([]);
      return;
    }
    fetch(`/api/users?departmentId=${form.departmentId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setHodFaculty(d.data);
        else setHodFaculty([]);
      });
  }, [form.departmentId, universityOnly]);

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

  async function assignHodForm(e: React.FormEvent) {
    e.preventDefault();
    if (!form.userId) return alert("Select a faculty member");
    if (!form.departmentId) return alert("Select a department");

    const dept = departments.find((d) => d.id === form.departmentId);
    const newUser = hodFaculty.find((u) => u.id === form.userId);
    if (!dept || !newUser) return;
    if (!confirmHodAssignment(dept, newUser)) return;

    setLoading(true);
    const res = await fetch(`/api/departments/${form.departmentId}/hod`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: form.userId,
        reason: form.reason || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      setForm((prev) => ({ ...prev, userId: "", reason: "" }));
      load();
      alert(
        dept.hod
          ? "HOD changed successfully"
          : "HOD assigned — they log in with their email as Head of Department"
      );
    } else {
      alert(data.error ?? "Failed");
    }
  }

  async function assignHod(dept: Dept, userId: string, faculty: UserOption[]) {
    if (!userId) return alert("Select a faculty member");
    const newUser = faculty.find((u) => u.id === userId);
    if (!newUser) return;
    if (!confirmHodAssignment(dept, newUser)) return;

    setLoading(true);
    const res = await fetch(`/api/departments/${dept.id}/hod`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      load();
      alert(dept.hod ? "HOD changed successfully" : "HOD assigned to department");
    } else {
      alert(data.error ?? "Failed");
    }
  }

  const activeByRole = (role: RoleCode) =>
    mappings.filter((m) => m.roleCode === role && !m.departmentId);

  const showHod = !universityOnly && !showUniversityRoles;
  const showUniversity = universityOnly;

  return (
    <div className="space-y-8">
      {showHod && (
        <>
          <form onSubmit={assignHodForm} className="nfa-card space-y-4">
            <h3 className="font-semibold text-slate-900">Assign Head of Department</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="nfa-label">Department *</label>
                <select
                  className="nfa-input"
                  value={form.departmentId}
                  onChange={(e) =>
                    setForm({ ...form, roleCode: "HOD", departmentId: e.target.value, userId: "" })
                  }
                  required
                >
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="nfa-label">Faculty (HOD login) *</label>
                <select
                  className="nfa-input"
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, roleCode: "HOD", userId: e.target.value })}
                  required
                  disabled={!form.departmentId}
                >
                  <option value="">
                    {form.departmentId ? "Select faculty from department" : "Select a department first"}
                  </option>
                  {hodFaculty.map((u) => (
                    <option key={u.id} value={u.id}>
                      {cleanDisplayName(u.firstName)} {cleanDisplayName(u.lastName)} ({u.email})
                    </option>
                  ))}
                </select>
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
              {form.departmentId && departments.find((d) => d.id === form.departmentId)?.hod
                ? "Change HOD"
                : "Save HOD Assignment"}
            </button>
          </form>

          <div className="nfa-card space-y-4">
            <h3 className="font-semibold text-slate-900">All departments — quick HOD assign</h3>
            <div className="space-y-3">
              {departments.map((d) => (
                <DeptHodRow
                  key={d.id}
                  dept={d}
                  loading={loading}
                  onAssign={(userId, faculty) => assignHod(d, userId, faculty)}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {showUniversity && (
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
      )}

      {showUniversity && (
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
      )}

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

function DeptHodRow({
  dept,
  loading,
  onAssign,
}: {
  dept: Dept;
  loading: boolean;
  onAssign: (userId: string, faculty: UserOption[]) => void;
}) {
  const [userId, setUserId] = useState("");
  const [faculty, setFaculty] = useState<UserOption[]>([]);

  useEffect(() => {
    fetch(`/api/users?departmentId=${dept.id}`)
      .then((r) => r.json())
      .then((d) => d.success && setFaculty(d.data));
  }, [dept.id]);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-nfa-border p-3">
      <div className="min-w-[140px] flex-1">
        <p className="font-medium text-slate-900">{dept.name}</p>
        <p className="text-xs text-slate-500">
          Current HOD:{" "}
          {dept.hod
            ? `${cleanDisplayName(dept.hod.firstName)} ${cleanDisplayName(dept.hod.lastName)}`
            : "None"}
        </p>
      </div>
      <select
        className="nfa-input max-w-xs flex-1"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      >
        <option value="">Select faculty as HOD</option>
        {faculty.map((u) => (
          <option key={u.id} value={u.id}>
            {cleanDisplayName(u.firstName)} {cleanDisplayName(u.lastName)}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="nfa-btn-secondary shrink-0"
        disabled={loading || !userId}
        onClick={() => onAssign(userId, faculty)}
      >
        {dept.hod ? "Change HOD" : "Set HOD"}
      </button>
    </div>
  );
}
