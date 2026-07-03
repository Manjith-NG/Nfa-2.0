"use client";

import { useState } from "react";
import { AuthorityManager } from "@/components/authorities/authority-manager";
import { ClubAuthorityManager } from "@/components/authorities/club-authority-manager";
import { FacultyRoster } from "@/components/authorities/faculty-roster";

const TABS = [
  { id: "university", label: "University Roles" },
  { id: "clubs", label: "Club Authorities" },
  { id: "roster", label: "Faculty by Department" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function StaffRolesHub({ initialTab = "university" }: { initialTab?: TabId }) {
  const [tab, setTab] = useState<TabId>(initialTab);

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

      {tab === "university" && (
        <div className="space-y-2">
          <p className="text-sm text-slate-500">
            Assign IQAC, PMSEB, HR, and COE — search faculty by name, email, or employee ID.
          </p>
          <AuthorityManager />
        </div>
      )}

      {tab === "clubs" && <ClubAuthorityManager />}

      {tab === "roster" && <FacultyRoster />}
    </div>
  );
}
