"use client";

import { useEffect, useState } from "react";
import { Loader2, X, Mail, Building2, UserCircle } from "lucide-react";

type UserProfile = {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  department: { name: string; code: string } | null;
  designation: { name: string } | null;
  position: { name: string } | null;
  role: { code: string; name: string };
};

export function UserDetailDrawer({
  userId,
  onClose,
}: {
  userId: string | null;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) {
          setProfile(data.data);
        } else {
          setError(data.error ?? "Could not load profile");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load profile");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-nfa-border px-5 py-4">
          <h3 className="font-semibold text-slate-900">Staff details</h3>
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
          {profile && (
            <div className="space-y-5">
              <div>
                <p className="text-lg font-semibold text-slate-900">
                  {profile.firstName} {profile.lastName}
                </p>
                <p className="text-sm text-nfa-primary">{profile.role.name}</p>
                <p className="mt-1 text-xs text-slate-500">ID: {profile.employeeId}</p>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <dt className="text-xs text-slate-500">Email</dt>
                    <dd className="font-medium text-slate-800">{profile.email}</dd>
                  </div>
                </div>
                {profile.department && (
                  <div className="flex items-start gap-3">
                    <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div>
                      <dt className="text-xs text-slate-500">Department</dt>
                      <dd className="font-medium text-slate-800">{profile.department.name}</dd>
                    </div>
                  </div>
                )}
                {(profile.designation || profile.position) && (
                  <div className="flex items-start gap-3">
                    <UserCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div>
                      <dt className="text-xs text-slate-500">Designation</dt>
                      <dd className="font-medium text-slate-800">
                        {[profile.designation?.name, profile.position?.name]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </dd>
                    </div>
                  </div>
                )}
                {profile.phone && (
                  <div>
                    <dt className="text-xs text-slate-500">Phone</dt>
                    <dd className="font-medium text-slate-800">{profile.phone}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
