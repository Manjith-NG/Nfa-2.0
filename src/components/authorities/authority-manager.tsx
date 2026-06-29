"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
  hod?: { firstName: string; lastName: string } | null;
}

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
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
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
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
    const q = new URLSearchParams();
    const roleCode = "FACULTY";
    if (!universityOnly && form.roleCode === "HOD" && form.departmentId) {
      q.set("departmentId", form.departmentId);
    }
    fetch(`/api/users?roleCode=${roleCode}&${q}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUsers(d.data);
        else setUsers([]);
      });
  }, [form.roleCode, form.departmentId, universityOnly]);

  async function assignUniversity(e: React.FormEvent) {
    e.preventDefault();
    if (!form.userId) return alert("Select a user");

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
      load();
      alert("Role assigned — user can log in with their email");
    } else {
      alert(data.error ?? "Failed");
    }
  }

  async function assignHodForm(e: React.FormEvent) {
    e.preventDefault();
    if (!form.userId) return alert("Select a user");
    if (!form.departmentId) return alert("Select a department");

    setLoading(true);
    const res = await fetch("/api/authorities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roleCode: "HOD",
        userId: form.userId,
        departmentId: form.departmentId,
        assignmentType: "PERMANENT",
        reason: form.reason || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      setForm((prev) => ({ ...prev, userId: "", reason: "" }));
      load();
      alert("HOD assigned — they log in with their email as Head of Department");
    } else {
      alert(data.error ?? "Failed");
    }
  }

  async function assignHod(deptId: string, userId: string) {
    if (!userId) return;
    setLoading(true);
    const res = await fetch(`/api/departments/${deptId}/hod`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      load();
      alert("HOD assigned to department");
    } else {
      alert(data.error ?? "Failed");
    }
  }

  const activeByRole = (role: RoleCode) =>
    mappings.filter((m) => m.roleCode === role && !m.departmentId);

  return (
    <div className="space-y-8">
      {!universityOnly && (
        <>
          <form onSubmit={assignHodForm} className="nfa-card space-y-4">
            <h3 className="font-semibold text-slate-900">Assign Head of Department</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" value="HOD" readOnly />
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
                >
                  <option value="">Select faculty from department</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email})
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
              Save HOD Assignment
            </button>
          </form>

          <div className="nfa-card space-y-4">
            <h3 className="font-semibold text-slate-900">All departments — quick HOD assign</h3>
            <div className="space-y-3">
              {departments.map((d) => (
                <DeptHodRow
                  key={d.id}
                  dept={d}
                  onAssign={(userId) => assignHod(d.id, userId)}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {(universityOnly || showUniversityRoles) && (
        <form onSubmit={assignUniversity} className="nfa-card space-y-4">
          <h3 className="font-semibold text-slate-900">
            {universityOnly ? "University-wide approval roles" : "Change university role"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="nfa-label">Role *</label>
              <select
                className="nfa-input"
                value={universityOnly ? form.roleCode : form.roleCode === "HOD" ? "IQAC" : form.roleCode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    roleCode: e.target.value as RoleCode,
                    userId: "",
                    departmentId: "",
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
              <select
                className="nfa-input"
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                required
              >
                <option value="">Select faculty / staff</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email})
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
            Save Assignment
          </button>
        </form>
      )}

      {(universityOnly || showUniversityRoles) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(["IQAC", "PMSEB", "HR", "COE"] as RoleCode[]).map((role) => (
            <div key={role} className="nfa-card">
              <p className="text-sm font-medium text-slate-500">{ROLE_LABELS[role]}</p>
              {activeByRole(role)[0] ? (
                <>
                  <p className="mt-1 font-semibold text-slate-900">
                    {activeByRole(role)[0].user.firstName} {activeByRole(role)[0].user.lastName}
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
                  {m.user.firstName} {m.user.lastName}
                  <p className="text-xs text-slate-500">{m.user.email}</p>
                </td>
                <td>{m.user.department?.name ?? m.departmentId ? "Dept-specific" : "University-wide"}</td>
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
  onAssign,
}: {
  dept: Dept;
  onAssign: (userId: string) => void;
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
          {dept.hod ? `${dept.hod.firstName} ${dept.hod.lastName}` : "None"}
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
            {u.firstName} {u.lastName}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="nfa-btn-secondary shrink-0"
        onClick={() => onAssign(userId)}
      >
        Set HOD
      </button>
    </div>
  );
}
