"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  Pencil,
  X,
} from "lucide-react";
import { ROLE_LABELS } from "@/lib/constants";
import { CONFIGURABLE_WORKFLOW_ROLES } from "@/lib/workflow/resolve";
import { ALL_SCOPE } from "@/components/ui/scope-chip-picker";
import type { RequestCategory, RoleCode } from "@prisma/client";

interface WorkflowTemplate {
  id: string;
  name: string;
  category: RequestCategory;
  academicSectionId: string | null;
  clubId: string | null;
  requestTypeId: string | null;
  steps: RoleCode[];
  isDefault: boolean;
  requestType?: { code: string; name: string } | null;
  club?: { id: string; code: string; name: string } | null;
  academicSection?: { id: string; code: string; name: string } | null;
}

interface ClubOption {
  id: string;
  name: string;
  code: string;
}

interface AcademicSectionOption {
  id: string;
  name: string;
  code: string;
}

type TemplateDraft = {
  name: string;
  steps: RoleCode[];
  isDefault: boolean;
};

function sectionScopeLabel(template: WorkflowTemplate): string {
  if (template.category !== "ACADEMIC") return "";
  if (template.academicSection?.name) return template.academicSection.name;
  return "All academic sections";
}

function clubScopeLabel(template: WorkflowTemplate): string {
  if (template.category !== "CLUB") return "";
  if (template.club?.name) return template.club.name;
  return "All clubs";
}

function rolesForCategory(category: RequestCategory): RoleCode[] {
  const base = CONFIGURABLE_WORKFLOW_ROLES.filter((r) => r !== "CLUB_AUTHORITY");
  if (category === "CLUB") {
    return ["CLUB_AUTHORITY", ...base.filter((r) => r !== "HOD")];
  }
  return base;
}

export function WorkflowTemplateManager({
  initialClubs = [],
  initialAcademicSections = [],
}: {
  initialClubs?: ClubOption[];
  initialAcademicSections?: AcademicSectionOption[];
}) {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [clubs, setClubs] = useState<ClubOption[]>(initialClubs);
  const [academicSections, setAcademicSections] = useState<AcademicSectionOption[]>(
    initialAcademicSections
  );
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TemplateDraft | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "ACADEMIC" as RequestCategory,
    academicSectionId: "" as string | typeof ALL_SCOPE | "",
    clubId: "" as string | typeof ALL_SCOPE | "",
    steps: ["IQAC", "PMSEB"] as RoleCode[],
    isDefault: false,
  });

  async function load() {
    const [templatesRes, clubsRes, sectionsRes] = await Promise.all([
      fetch("/api/workflow/templates"),
      fetch("/api/master/clubs"),
      fetch("/api/master/academic-sections"),
    ]);
    const data = await templatesRes.json();
    const clubsData = await clubsRes.json();
    const sectionsData = await sectionsRes.json();
    if (data.success) {
      setTemplates(
        data.data.map((t: WorkflowTemplate & { steps: unknown }) => ({
          ...t,
          steps: Array.isArray(t.steps) ? (t.steps as RoleCode[]) : [],
        }))
      );
    }
    if (clubsData.success) {
      setClubs(clubsData.data);
    }
    if (sectionsData.success) {
      setAcademicSections(sectionsData.data);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const appliesToPreview = useMemo(() => {
    if (form.category === "ACADEMIC") {
      if (!form.academicSectionId) return null;
      if (form.academicSectionId === ALL_SCOPE) {
        return "All academic sections — used when no section-specific flow exists";
      }
      const section = academicSections.find((s) => s.id === form.academicSectionId);
      return section ? `${section.name} requests only` : null;
    }
    if (!form.clubId) return null;
    if (form.clubId === ALL_SCOPE) {
      return "All clubs — used when no club-specific flow exists";
    }
    const club = clubs.find((c) => c.id === form.clubId);
    return club ? `${club.name} requests only` : null;
  }, [form.category, form.academicSectionId, form.clubId, clubs, academicSections]);

  function toggleStep(role: RoleCode) {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.includes(role)
        ? prev.steps.filter((r) => r !== role)
        : [...prev.steps, role],
    }));
  }

  function moveStep(index: number, direction: -1 | 1) {
    setForm((prev) => {
      const next = [...prev.steps];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, steps: next };
    });
  }

  function startEdit(template: WorkflowTemplate) {
    setEditingId(template.id);
    setDraft({
      name: template.name,
      steps: [...template.steps],
      isDefault: template.isDefault,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function toggleDraftStep(role: RoleCode) {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        steps: prev.steps.includes(role)
          ? prev.steps.filter((r) => r !== role)
          : [...prev.steps, role],
      };
    });
  }

  function moveDraftStep(index: number, direction: -1 | 1) {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = [...prev.steps];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, steps: next };
    });
  }

  async function createTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (form.steps.length === 0) {
      alert("Select at least one approval authority");
      return;
    }

    const isAllAcademic = form.category === "ACADEMIC" && form.academicSectionId === ALL_SCOPE;
    const isAllClubs = form.category === "CLUB" && form.clubId === ALL_SCOPE;

    if (form.category === "ACADEMIC" && !form.academicSectionId) {
      alert("Select which academic section this flow applies to");
      return;
    }

    if (form.category === "CLUB" && !form.clubId) {
      alert("Select which club section this flow applies to");
      return;
    }

    if ((isAllAcademic || isAllClubs) && !form.isDefault) {
      alert('Flows for "All sections" or "All clubs" must be marked as default');
      return;
    }

    setLoading(true);
    const res = await fetch("/api/workflow/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        category: form.category,
        academicSectionId:
          form.category === "ACADEMIC" && !isAllAcademic
            ? (form.academicSectionId as string)
            : undefined,
        clubId: form.category === "CLUB" && !isAllClubs ? form.clubId : undefined,
        steps: form.steps,
        isDefault: form.isDefault || isAllAcademic || isAllClubs,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      setForm({
        name: "",
        category: "ACADEMIC",
        academicSectionId: "",
        clubId: "",
        steps: ["IQAC", "PMSEB"],
        isDefault: false,
      });
      load();
    } else {
      alert(data.error ?? "Failed to create template");
    }
  }

  async function saveEditedTemplate(template: WorkflowTemplate) {
    if (!draft) return;
    if (draft.steps.length === 0) {
      alert("Select at least one approval authority");
      return;
    }
    if (!draft.name.trim()) {
      alert("Template name is required");
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/workflow/templates/${template.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name.trim(),
        steps: draft.steps,
        isDefault: draft.isDefault,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      cancelEdit();
      await load();
      alert("Template updated");
    } else {
      alert(data.error ?? "Failed to save");
    }
  }

  async function removeTemplate(id: string) {
    if (
      !confirm(
        "Delete this workflow template permanently? New requests will no longer use this path."
      )
    ) {
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/workflow/templates/${id}`, { method: "DELETE" });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      if (editingId === id) cancelEdit();
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } else {
      alert(data.error ?? "Failed to delete template");
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={createTemplate} className="nfa-card space-y-4">
        <div>
          <h3 className="font-semibold text-slate-900">Create approval workflow template</h3>
          <p className="mt-1 text-sm text-slate-500">
            Pick exactly one scope: a single section/club, or All as the default fallback. Registrar
            and awaiting final clearance are added automatically.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="nfa-label">Template name *</label>
            <input
              className="nfa-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Department → HOD → IQAC → PMSEB"
              required
            />
          </div>
          <div>
            <label className="nfa-label">Request category *</label>
            <select
              className="nfa-input"
              value={form.category}
              required
              onChange={(e) => {
                const category = e.target.value as RequestCategory;
                setForm({
                  ...form,
                  category,
                  steps: category === "CLUB" ? ["CLUB_AUTHORITY", "IQAC"] : ["IQAC", "PMSEB"],
                  academicSectionId: "",
                  clubId: "",
                  isDefault: false,
                });
              }}
            >
              <option value="ACADEMIC">Academic</option>
              <option value="CLUB">Club</option>
            </select>
          </div>
          {form.category === "ACADEMIC" && (
            <div className="sm:col-span-2">
              <label className="nfa-label">
                Academic section <span className="text-red-500">*</span>
              </label>
              <select
                className="nfa-input"
                value={form.academicSectionId}
                required
                onChange={(e) =>
                  setForm({
                    ...form,
                    academicSectionId: e.target.value,
                    isDefault: e.target.value === ALL_SCOPE ? true : form.isDefault,
                  })
                }
              >
                <option value="">Select academic section</option>
                <option value={ALL_SCOPE}>All academic sections (default fallback)</option>
                {academicSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {form.category === "CLUB" && (
            <div className="sm:col-span-2">
              <label className="nfa-label">
                Club section <span className="text-red-500">*</span>
              </label>
              <select
                className="nfa-input"
                value={form.clubId}
                required
                onChange={(e) =>
                  setForm({
                    ...form,
                    clubId: e.target.value,
                    isDefault: e.target.value === ALL_SCOPE ? true : form.isDefault,
                  })
                }
              >
                <option value="">Select club section</option>
                <option value={ALL_SCOPE}>All clubs (default fallback)</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {appliesToPreview && (
            <div className="sm:col-span-2 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
              This flow will apply to: <strong>{appliesToPreview}</strong>
            </div>
          )}
          <div className="flex items-end sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isDefault}
                disabled={form.academicSectionId === ALL_SCOPE || form.clubId === ALL_SCOPE}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              />
              Set as default for this category/scope
              {(form.academicSectionId === ALL_SCOPE || form.clubId === ALL_SCOPE) && (
                <span className="text-xs text-slate-500">(required for All)</span>
              )}
            </label>
          </div>
        </div>

        <div>
          <label className="nfa-label">Approval authorities (in order) *</label>
          <div className="flex flex-wrap gap-2">
            {rolesForCategory(form.category).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => toggleStep(role)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  form.steps.includes(role)
                    ? "border-nfa-primary bg-nfa-primary/10 text-nfa-primary"
                    : "border-nfa-border text-slate-600 hover:bg-slate-50"
                }`}
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </div>
          {form.steps.length > 0 && (
            <div className="mt-3 space-y-2 rounded-lg border border-nfa-border bg-slate-50 p-3">
              {form.steps.map((role, index) => (
                <div key={role} className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-800">
                    {index + 1}. {ROLE_LABELS[role]}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="rounded p-1 hover:bg-white"
                      onClick={() => moveStep(index, -1)}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-1 hover:bg-white"
                      onClick={() => moveStep(index, 1)}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <p className="text-xs text-slate-500">
                → Registrar → Awaiting final clearance (automatic)
              </p>
            </div>
          )}
        </div>

        <button type="submit" className="nfa-btn-primary" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Create template
        </button>
      </form>

      <div className="space-y-4">
        <h3 className="font-semibold text-slate-900">Active workflow templates</h3>
        {templates.length === 0 ? (
          <div className="nfa-card py-10 text-center text-slate-500">
            No templates yet. Create one flow per section or club (or one All default).
          </div>
        ) : (
          templates.map((template) => {
            const isEditing = editingId === template.id && draft;
            return (
              <div key={template.id} className="nfa-card space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <label className="nfa-label">Template name</label>
                        <input
                          className="nfa-input"
                          value={draft.name}
                          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        />
                      </div>
                    ) : (
                      <>
                        <p className="font-semibold text-slate-900">{template.name}</p>
                        <p className="text-sm text-slate-500">
                          {template.category}
                          {template.category === "ACADEMIC" &&
                            ` · ${sectionScopeLabel(template)}`}
                          {template.category === "CLUB" && ` · ${clubScopeLabel(template)}`}
                          {template.isDefault ? " · Default" : ""}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="nfa-btn-primary py-1.5"
                          onClick={() => saveEditedTemplate(template)}
                          disabled={loading}
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Save changes
                        </button>
                        <button
                          type="button"
                          className="nfa-btn-secondary py-1.5"
                          onClick={cancelEdit}
                          disabled={loading}
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="nfa-btn-secondary py-1.5"
                          onClick={() => startEdit(template)}
                          disabled={loading || Boolean(editingId)}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="nfa-btn-secondary border-red-200 py-1.5 text-red-700"
                          onClick={() => removeTemplate(template.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-3 border-t border-nfa-border pt-3">
                    <p className="text-sm text-slate-500">
                      {template.category}
                      {template.category === "ACADEMIC" &&
                        ` · ${sectionScopeLabel(template)}`}
                      {template.category === "CLUB" && ` · ${clubScopeLabel(template)}`}
                    </p>

                    <div>
                      <label className="nfa-label">Add or remove approval authorities</label>
                      <div className="flex flex-wrap gap-2">
                        {rolesForCategory(template.category).map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => toggleDraftStep(role)}
                            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                              draft.steps.includes(role)
                                ? "border-nfa-primary bg-nfa-primary/10 text-nfa-primary"
                                : "border-nfa-border text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {ROLE_LABELS[role]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {draft.steps.length > 0 && (
                      <div className="space-y-2 rounded-lg border border-nfa-border bg-slate-50 p-3">
                        {draft.steps.map((role, index) => (
                          <div
                            key={role}
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="text-sm font-medium text-slate-800">
                              {index + 1}. {ROLE_LABELS[role]}
                            </span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                className="rounded p-1 hover:bg-white"
                                onClick={() => moveDraftStep(index, -1)}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="rounded p-1 hover:bg-white"
                                onClick={() => moveDraftStep(index, 1)}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <p className="text-xs text-slate-500">
                          → Registrar → Awaiting final clearance (automatic)
                        </p>
                      </div>
                    )}

                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={draft.isDefault}
                        onChange={(e) =>
                          setDraft({ ...draft, isDefault: e.target.checked })
                        }
                      />
                      Set as default for this category/scope
                    </label>
                  </div>
                ) : (
                  <p className="text-sm text-slate-700">
                    {template.steps.map((r) => ROLE_LABELS[r]).join(" → ")} → Registrar →
                    Awaiting final clearance
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
