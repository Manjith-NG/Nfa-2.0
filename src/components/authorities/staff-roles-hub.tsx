"use client";

import { useEffect, useState } from "react";
import { AuthorityManager } from "@/components/authorities/authority-manager";
import { ClubAuthorityManager } from "@/components/authorities/club-authority-manager";
import { FacultyRoster } from "@/components/authorities/faculty-roster";
import { canDeleteUsers, canEditUsers } from "@/lib/rbac";
import type { SessionUser } from "@/types";

const TABS = [
  { id: "hod", label: "Department & HOD" },
  { id: "university", label: "University Roles" },
  { id: "clubs", label: "Club Authorities" },
  { id: "roster", label: "Faculty by Department" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function StaffRolesHub({
  initialTab = "hod",
  viewer,
}: {
  initialTab?: TabId;
  viewer?: SessionUser;
}) {
  const [tab, setTab] = useState<TabId>(initialTab);
  const [visited, setVisited] = useState<Record<TabId, boolean>>({
    hod: true,
    university: initialTab === "university",
    // Load clubs in the background so the tab does not flash "No clubs"
    clubs: true,
    roster: initialTab === "roster",
  });

  useEffect(() => {
    setVisited((prev) => (prev[tab] ? prev : { ...prev, [tab]: true }));
  }, [tab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-nfa-border pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-b-2 border-nfa-primary text-nfa-primary"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {visited.hod && (
        <div className={tab === "hod" ? "space-y-2" : "hidden"}>
          <p className="text-sm text-slate-500">
            Each department has its own HOD login. Faculty in that department raise requests; the
            HOD approves department-section requests.
          </p>
          <AuthorityManager showUniversityRoles={false} />
        </div>
      )}

      {visited.university && (
        <div className={tab === "university" ? "space-y-2" : "hidden"}>
          <p className="text-sm text-slate-500">
            Assign IQAC, PMSEB, HR, and COE — search faculty by name, email, or employee ID.
          </p>
          <AuthorityManager universityOnly />
        </div>
      )}

      {visited.clubs && (
        <div className={tab === "clubs" ? "block" : "hidden"}>
          <ClubAuthorityManager />
        </div>
      )}

      {visited.roster && (
        <div className={tab === "roster" ? "block" : "hidden"}>
          <FacultyRoster
            viewer={viewer}
            allowEdit={viewer ? canEditUsers(viewer) : false}
            allowDelete={viewer ? canDeleteUsers(viewer) : false}
          />
        </div>
      )}
    </div>
  );
}
