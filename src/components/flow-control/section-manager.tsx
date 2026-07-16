"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import type { RoleCode } from "@prisma/client";
import {
  WorkflowPathPreview,
  type WorkflowAuthority,
  type WorkflowPreviewStep,
} from "@/components/workflow/workflow-path-preview";
import { UserDetailDrawer } from "@/components/users/user-detail-drawer";

interface ClubOption {
  id: string;
  code: string;
  name: string;
}

interface AcademicSectionOption {
  id: string;
  code: string;
  name: string;
  entryRole: RoleCode;
  routesTo: string;
}

const ENTRY_ROLE_OPTIONS: { value: RoleCode; label: string }[] = [
  { value: "IQAC", label: "IQAC (default)" },
  { value: "HOD", label: "HOD first" },
  { value: "HR", label: "HR first" },
  { value: "COE", label: "COE first" },
];

function SectionWorkflowPreview({
  category,
  academicSectionId,
  clubId,
  onAuthorityClick,
}: {
  category: "ACADEMIC" | "CLUB";
  academicSectionId?: string;
  clubId?: string;
  onAuthorityClick: (userId: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<WorkflowPreviewStep[]>([]);
  const [authorities, setAuthorities] = useState<WorkflowAuthority[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams({ category });
    if (academicSectionId) params.set("academicSectionId", academicSectionId);
    if (clubId) params.set("clubId", clubId);

    fetch(`/api/workflow/preview?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) {
          setSteps(data.data.steps ?? []);
          setAuthorities(data.data.authorities ?? []);
        } else {
          setSteps([]);
          setAuthorities([]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSteps([]);
          setAuthorities([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category, academicSectionId, clubId]);

  if (loading) {
    return (
      <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading flow…
      </p>
    );
  }

  if (steps.length === 0) return null;

  return (
    <div className="mt-2 rounded-lg border border-nfa-border bg-slate-50/60 p-2.5">
      <WorkflowPathPreview
        steps={steps}
        authorities={authorities}
        onAuthorityClick={onAuthorityClick}
        compact
      />
    </div>
  );
}

export function SectionManager({
  initialClubs,
  initialAcademicSections,
  onClubAdded,
  onAcademicSectionAdded,
}: {
  initialClubs: ClubOption[];
  initialAcademicSections: AcademicSectionOption[];
  onClubAdded?: () => void;
  onAcademicSectionAdded?: () => void;
}) {
  const [clubs, setClubs] = useState(initialClubs);
  const [academicSections, setAcademicSections] = useState(initialAcademicSections);
  const [clubLoading, setClubLoading] = useState(false);
  const [academicLoading, setAcademicLoading] = useState(false);
  const [clubForm, setClubForm] = useState({ code: "", name: "" });
  const [academicForm, setAcademicForm] = useState({
    code: "",
    name: "",
    entryRole: "IQAC" as RoleCode,
  });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [expandedAcademicId, setExpandedAcademicId] = useState<string | null>(null);
  const [expandedClubId, setExpandedClubId] = useState<string | null>(null);

  async function handleAddClub(e: React.FormEvent) {
    e.preventDefault();
    setClubLoading(true);
    const res = await fetch("/api/master/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clubForm),
    });
    const data = await res.json();
    setClubLoading(false);

    if (data.success) {
      setClubs((prev) => [...prev, data.data].sort((a, b) => a.name.localeCompare(b.name)));
      setClubForm({ code: "", name: "" });
      onClubAdded?.();
    } else {
      alert(data.error ?? "Failed to add club section");
    }
  }

  async function handleAddAcademicSection(e: React.FormEvent) {
    e.preventDefault();
    setAcademicLoading(true);
    const res = await fetch("/api/master/academic-sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(academicForm),
    });
    const data = await res.json();
    setAcademicLoading(false);

    if (data.success) {
      const section = {
        id: data.data.id,
        code: data.data.code,
        name: data.data.name,
        entryRole: data.data.entryRole as RoleCode,
        routesTo: data.data.routesTo,
      };
      setAcademicSections((prev) =>
        [...prev, section].sort((a, b) => a.name.localeCompare(b.name))
      );
      setAcademicForm({ code: "", name: "", entryRole: "IQAC" });
      onAcademicSectionAdded?.();
    } else {
      alert(data.error ?? "Failed to add academic section");
    }
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="nfa-card space-y-4">
          <div>
            <h3 className="font-semibold text-slate-900">Academic Sections</h3>
            <p className="mt-1 text-sm text-slate-500">
              Sections used when raising academic requests. Expand to view approval flow, or add
              new sections below.
            </p>
          </div>
          <ul className="max-h-80 divide-y divide-nfa-border overflow-y-auto rounded-lg border border-nfa-border">
            {academicSections.map((section) => {
              const isOpen = expandedAcademicId === section.id;
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-slate-50"
                    onClick={() => setExpandedAcademicId(isOpen ? null : section.id)}
                  >
                    <span>
                      <span className="font-medium text-slate-800">{section.name}</span>
                      <span className="ml-2 text-xs text-slate-400">
                        ({section.code}) · routes to {section.routesTo}
                      </span>
                    </span>
                    <span className="text-xs text-slate-400">{isOpen ? "Hide" : "View flow"}</span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-nfa-border px-4 pb-3">
                      <SectionWorkflowPreview
                        category="ACADEMIC"
                        academicSectionId={section.id}
                        onAuthorityClick={setSelectedUserId}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <form onSubmit={handleAddAcademicSection} className="space-y-3 border-t border-nfa-border pt-4">
            <p className="text-sm font-medium text-slate-700">Add new academic section</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="nfa-label">Code</label>
                <input
                  className="nfa-input"
                  value={academicForm.code}
                  onChange={(e) => setAcademicForm({ ...academicForm, code: e.target.value })}
                  placeholder="e.g. LIBRARY"
                  required
                />
              </div>
              <div>
                <label className="nfa-label">Name</label>
                <input
                  className="nfa-input"
                  value={academicForm.name}
                  onChange={(e) => setAcademicForm({ ...academicForm, name: e.target.value })}
                  placeholder="e.g. Library Services"
                  required
                />
              </div>
            </div>
            <div>
              <label className="nfa-label">First approver</label>
              <select
                className="nfa-input"
                value={academicForm.entryRole}
                onChange={(e) =>
                  setAcademicForm({
                    ...academicForm,
                    entryRole: e.target.value as RoleCode,
                  })
                }
              >
                {ENTRY_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="nfa-btn-primary" disabled={academicLoading}>
              {academicLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Academic Section
            </button>
          </form>
        </div>

        <div className="nfa-card space-y-4">
          <div>
            <h3 className="font-semibold text-slate-900">Club Sections</h3>
            <p className="mt-1 text-sm text-slate-500">
              Each club has its own authority and approval flow. Expand a club to view details.
            </p>
          </div>

          <ul className="max-h-80 divide-y divide-nfa-border overflow-y-auto rounded-lg border border-nfa-border">
            {clubs.map((club) => {
              const isOpen = expandedClubId === club.id;
              return (
                <li key={club.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                    onClick={() => setExpandedClubId(isOpen ? null : club.id)}
                  >
                    <span>
                      <span className="font-medium text-slate-800">{club.name}</span>
                      <span className="ml-2 text-xs text-slate-400">({club.code})</span>
                    </span>
                    <span className="text-xs text-slate-400">{isOpen ? "Hide" : "View flow"}</span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-nfa-border px-4 pb-3">
                      <SectionWorkflowPreview
                        category="CLUB"
                        clubId={club.id}
                        onAuthorityClick={setSelectedUserId}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <form onSubmit={handleAddClub} className="space-y-3 border-t border-nfa-border pt-4">
            <p className="text-sm font-medium text-slate-700">Add new club section</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="nfa-label">Code</label>
                <input
                  className="nfa-input"
                  value={clubForm.code}
                  onChange={(e) => setClubForm({ ...clubForm, code: e.target.value })}
                  placeholder="e.g. DEBATE"
                  required
                />
              </div>
              <div>
                <label className="nfa-label">Name</label>
                <input
                  className="nfa-input"
                  value={clubForm.name}
                  onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
                  placeholder="e.g. Debate Club"
                  required
                />
              </div>
            </div>
            <button type="submit" className="nfa-btn-primary" disabled={clubLoading}>
              {clubLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Club Section
            </button>
          </form>
        </div>
      </div>

      <UserDetailDrawer userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
    </>
  );
}
