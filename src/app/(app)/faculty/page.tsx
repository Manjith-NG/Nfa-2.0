"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface MasterOption {
  id: string;
  name: string;
}

export default function FacultyPage() {
  const [departments, setDepartments] = useState<MasterOption[]>([]);
  const [designations, setDesignations] = useState<MasterOption[]>([]);
  const [positions, setPositions] = useState<MasterOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    departmentId: "",
    designationId: "",
    positionId: "",
    password: "password123",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/master/departments").then((r) => r.json()),
      fetch("/api/master/designations").then((r) => r.json()),
      fetch("/api/master/employee-positions").then((r) => r.json()),
    ]).then(([depts, des, pos]) => {
      if (depts.success) setDepartments(depts.data);
      if (des.success) setDesignations(des.data);
      if (pos.success) setPositions(pos.data);
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        designationId: form.designationId || undefined,
        positionId: form.positionId || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      alert(`Faculty ${form.firstName} ${form.lastName} created. Default password: ${form.password}`);
      setForm({
        employeeId: "",
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        departmentId: form.departmentId,
        designationId: "",
        positionId: "",
        password: "password123",
      });
    } else {
      alert(data.error ?? "Failed to create faculty");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Add New Faculty</h2>
        <p className="text-slate-500">
          Register a faculty member under a department. They log in with their email and see only
          their department&apos;s data.
        </p>
      </div>

      <form onSubmit={submit} className="nfa-card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
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
            <label className="nfa-label">First Name *</label>
            <input
              className="nfa-input"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="nfa-label">Last Name *</label>
            <input
              className="nfa-input"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="nfa-label">Phone</label>
            <input
              className="nfa-input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="nfa-label">Department *</label>
            <select
              className="nfa-input"
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
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
            <label className="nfa-label">Designation</label>
            <select
              className="nfa-input"
              value={form.designationId}
              onChange={(e) => setForm({ ...form, designationId: e.target.value })}
            >
              <option value="">Select designation</option>
              {designations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="nfa-label">Employee position</label>
            <select
              className="nfa-input"
              value={form.positionId}
              onChange={(e) => setForm({ ...form, positionId: e.target.value })}
            >
              <option value="">Select position</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="nfa-label">Initial Password</label>
            <input
              className="nfa-input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <p className="mt-1 text-xs text-slate-500">Share securely with the faculty member</p>
          </div>
        </div>
        <button type="submit" className="nfa-btn-primary" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Add Faculty
        </button>
      </form>
    </div>
  );
}
