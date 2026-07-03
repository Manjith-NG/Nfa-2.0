"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/types";

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-nfa-border/70 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900 sm:text-right">{value?.trim() || "—"}</dd>
    </div>
  );
}

export function ProfileDetails({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [phone, setPhone] = useState("");
  const [displayPhone, setDisplayPhone] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setDisplayPhone(data.data.phone ?? null);
        }
      })
      .catch(() => undefined);
  }, [user.firstName, user.lastName]);

  async function startEdit() {
    setEditing(true);
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (data.success) {
        setFirstName(data.data.firstName ?? user.firstName);
        setLastName(data.data.lastName ?? user.lastName);
        setPhone(data.data.phone ?? "");
      }
    } catch {
      setPhone("");
    }
  }

  function cancelEdit() {
    setEditing(false);
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPhone("");
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, phone: phone || undefined }),
    });
    const data = await res.json();
    setSaving(false);

    if (!data.success) {
      alert(data.error ?? "Could not save profile");
      return;
    }

    setEditing(false);
    setDisplayPhone(data.data.phone ?? null);
    router.refresh();
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim();

  return (
    <section className="nfa-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
          <p className="mt-1 text-sm text-slate-600">
            Your account information. You can update your name and mobile number.
          </p>
        </div>
        {!editing && (
          <button type="button" onClick={() => void startEdit()} className="nfa-btn-secondary inline-flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Edit profile
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={saveProfile} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="nfa-label">First name</label>
              <input
                className="nfa-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="nfa-label">Last name</label>
              <input
                className="nfa-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="nfa-label">Mobile number</label>
              <input
                className="nfa-input"
                type="tel"
                inputMode="numeric"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="nfa-btn-primary inline-flex items-center gap-2" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save changes
            </button>
            <button type="button" className="nfa-btn-secondary" onClick={cancelEdit} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <dl className="mt-4 divide-y divide-nfa-border/70">
          <DetailRow label="Full name" value={fullName} />
          <DetailRow label="Email" value={user.email} />
          <DetailRow label="Mobile number" value={displayPhone} />
          <DetailRow label="Employee ID" value={user.employeeId} />
          <DetailRow label="Department" value={user.departmentName} />
          <DetailRow label="Designation" value={user.designationName} />
          <DetailRow label="Position" value={user.positionName} />
        </dl>
      )}
    </section>
  );
}
