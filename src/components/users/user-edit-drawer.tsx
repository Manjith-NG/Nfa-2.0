"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { ROLE_LABELS } from "@/lib/constants";
import { DEMO_LOGIN_PASSWORD } from "@/lib/demo-users";
import type { RoleCode } from "@prisma/client";

type MasterOption = { id: string; name: string };

type EditableUser = {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  departmentId: string | null;
  designationId: string | null;
  positionId: string | null;
  department: { id: string; name: string; code: string } | null;
  designation: { id: string; name: string } | null;
  position: { id: string; name: string } | null;
  role: { code: RoleCode; name: string };
};

export function UserEditDrawer({
  userId,
  onClose,
  onSaved,
}: {
  userId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState<MasterOption[]>([]);
  const [designations, setDesignations] = useState<MasterOption[]>([]);
  const [positions, setPositions] = useState<MasterOption[]>([]);
  const [form, setForm] = useState({
    employeeId: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    departmentId: "",
    designationId: "",
    positionId: "",
  });
  const [roleCode, setRoleCode] = useState<RoleCode>("FACULTY");
  const [loginPassword, setLoginPassword] = useState<string | null>(DEMO_LOGIN_PASSWORD);
  const [passwordIsEstimated, setPasswordIsEstimated] = useState(false);
  const [passwordUnknown, setPasswordUnknown] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    Promise.all([
      fetch(`/api/users/${userId}`).then((r) => r.json()),
      fetch("/api/master/departments").then((r) => r.json()),
      fetch("/api/master/designations").then((r) => r.json()),
      fetch("/api/master/employee-positions").then((r) => r.json()),
    ])
      .then(([userRes, deptRes, desRes, posRes]) => {
        if (cancelled) return;
        if (deptRes.success) setDepartments(deptRes.data);
        if (desRes.success) setDesignations(desRes.data);
        if (posRes.success) setPositions(posRes.data);

        if (!userRes.success) {
          setError(userRes.error ?? "Could not load user");
          return;
        }

        const user = userRes.data as EditableUser & {
          loginPassword?: string | null;
          loginPasswordIsEstimated?: boolean;
          loginPasswordKnown?: boolean;
        };
        setRoleCode(user.role.code);
        setLoginPassword(user.loginPassword ?? null);
        setPasswordIsEstimated(Boolean(user.loginPasswordIsEstimated));
        setPasswordUnknown(user.loginPasswordKnown === false);
        setNewPassword("");
        setForm({
          employeeId: user.employeeId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone ?? "",
          departmentId: user.departmentId ?? "",
          designationId: user.designationId ?? "",
          positionId: user.positionId ?? "",
        });
      })
      .catch(() => {
        if (!cancelled) setError("Could not load user");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: form.employeeId,
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || null,
        departmentId: form.departmentId || null,
        designationId: form.designationId || null,
        positionId: form.positionId || null,
        ...(newPassword.trim() ? { password: newPassword.trim() } : {}),
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (!data.success) {
      alert(data.error ?? "Failed to save user");
      return;
    }

    onSaved();
    onClose();
  }

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-lg overflow-y-auto bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-nfa-border px-5 py-4">
          <div>
            <h3 className="font-semibold text-slate-900">Edit user</h3>
            <p className="text-xs text-slate-500">{ROLE_LABELS[roleCode] ?? roleCode}</p>
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-nfa-primary" />
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && (
            <form onSubmit={save} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="nfa-label">First name *</label>
                  <input
                    className="nfa-input"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="nfa-label">Last name *</label>
                  <input
                    className="nfa-input"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="nfa-label">Employee ID *</label>
                  <input
                    className="nfa-input"
                    value={form.employeeId}
                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="nfa-label">Email *</label>
                  <input
                    type="email"
                    className="nfa-input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="nfa-label">Mobile</label>
                  <input
                    className="nfa-input"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="nfa-label">Login password</label>
                  {loginPassword ? (
                    <input className="nfa-input font-mono" value={loginPassword} readOnly />
                  ) : (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      Password was changed by the user and is not stored in plain text. Set a new
                      password below to assign one the user can use.
                    </p>
                  )}
                  {passwordIsEstimated && loginPassword && (
                    <p className="mt-1 text-xs text-amber-600">
                      Likely still the default import password. Set a new password below to confirm.
                    </p>
                  )}
                  {passwordUnknown && !loginPassword && (
                    <p className="mt-1 text-xs text-slate-500">
                      After you set a new password here, it will appear in this list for developer
                      reference.
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="nfa-label">Set new password</label>
                  <input
                    type="text"
                    className="nfa-input font-mono"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="nfa-label">Department</label>
                  <select
                    className="nfa-input"
                    value={form.departmentId}
                    onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  >
                    <option value="">None</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="nfa-label">Designation</label>
                  <select
                    className="nfa-input"
                    value={form.designationId}
                    onChange={(e) => setForm({ ...form, designationId: e.target.value })}
                  >
                    <option value="">None</option>
                    {designations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="nfa-label">Position</label>
                  <select
                    className="nfa-input"
                    value={form.positionId}
                    onChange={(e) => setForm({ ...form, positionId: e.target.value })}
                  >
                    <option value="">None</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Login role is managed under Staff & Roles. Use Department & HOD or University Roles
                tabs to change approver assignments.
              </p>
              <div className="flex justify-end gap-2 border-t border-nfa-border pt-4">
                <button type="button" className="nfa-btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="nfa-btn-primary" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
