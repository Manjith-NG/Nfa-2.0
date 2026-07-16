"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface Club {
  id: string;
  code: string;
  name: string;
}

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: { name: string } | null;
}

interface ClubAuthorityRow {
  id: string;
  clubId: string;
  club: Club;
  user: UserOption;
}

function displayName(user: Pick<UserOption, "firstName" | "lastName">) {
  const first = user.firstName.trim();
  const last = user.lastName.trim();
  if (!last || last.toLowerCase() === first.toLowerCase()) return first;
  return `${first} ${last}`;
}

export function ClubAuthorityManager() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [authorities, setAuthorities] = useState<ClubAuthorityRow[]>([]);
  const [faculty, setFaculty] = useState<UserOption[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [savingClubId, setSavingClubId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  async function load() {
    setError("");
    const res = await fetch("/api/clubs/authorities");
    const data = await res.json();
    if (!data.success) {
      setError(data.error ?? "Could not load club authorities");
      return;
    }

    setClubs(data.data.clubs);
    setAuthorities(data.data.authorities);
    setFaculty(data.data.faculty ?? []);

    const initial: Record<string, string> = {};
    for (const row of data.data.authorities as ClubAuthorityRow[]) {
      if (!initial[row.clubId]) {
        initial[row.clubId] = row.user.id;
      }
    }
    setAssignments(initial);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function authorityForClub(clubId: string): ClubAuthorityRow | undefined {
    return authorities.find((a) => a.clubId === clubId);
  }

  async function assignClub(clubId: string) {
    const userId = assignments[clubId];
    if (!userId) {
      alert("Select a faculty member for this club");
      return;
    }

    setSavingClubId(clubId);
    const res = await fetch("/api/clubs/authorities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clubId, userId }),
    });
    const data = await res.json();
    setSavingClubId(null);
    if (data.success) {
      await load();
      alert("Club authority assigned — they can log in with their email to approve club requests");
    } else {
      alert(data.error ?? "Failed to assign");
    }
  }

  if (initialLoading) {
    return (
      <div className="nfa-card flex items-center justify-center gap-2 py-12 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-nfa-primary" />
        Loading clubs…
      </div>
    );
  }

  if (error) {
    return (
      <div className="nfa-card space-y-3 py-8 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          className="nfa-btn-secondary"
          onClick={async () => {
            setInitialLoading(true);
            try {
              await load();
            } finally {
              setInitialLoading(false);
            }
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Assign one faculty member per club or committee. They receive a club-authority login to
        approve requests raised for that club. Faculty stay in their department; only their
        approval role changes.
      </p>

      {clubs.length === 0 ? (
        <div className="nfa-card py-10 text-center text-slate-500">No clubs configured</div>
      ) : (
        <div className="space-y-3">
          {clubs.map((club) => {
            const current = authorityForClub(club.id);
            const saving = savingClubId === club.id;
            return (
              <div
                key={club.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-nfa-border bg-white p-4"
              >
                <div className="min-w-[160px] flex-1">
                  <p className="font-semibold text-slate-900">{club.name}</p>
                  <p className="text-xs text-slate-500">
                    Current:{" "}
                    {current
                      ? `${displayName(current.user)} (${current.user.department?.name ?? "—"})`
                      : "Not assigned"}
                  </p>
                </div>
                <select
                  className="nfa-input min-w-[220px] flex-1"
                  value={assignments[club.id] ?? ""}
                  onChange={(e) =>
                    setAssignments((prev) => ({ ...prev, [club.id]: e.target.value }))
                  }
                >
                  <option value="">Select faculty</option>
                  {faculty.map((u) => (
                    <option key={u.id} value={u.id}>
                      {displayName(u)} — {u.department?.name ?? "No dept"} ({u.email})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="nfa-btn-primary shrink-0"
                  disabled={saving || Boolean(savingClubId)}
                  onClick={() => assignClub(club.id)}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
