"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, X, FileText } from "lucide-react";
import type { SessionUser } from "@/types";
import {
  BudgetLineTable,
  createDefaultLines,
  serializeLines,
  type BudgetLine,
} from "@/components/requests/budget-line-table";
import { APP_NAME } from "@/lib/constants";
import { validateRequestFormFields } from "@/lib/request-validation";
import {
  WorkflowPathPreview,
  type WorkflowAuthority,
  type WorkflowPreviewStep,
} from "@/components/workflow/workflow-path-preview";
import { UserDetailDrawer } from "@/components/users/user-detail-drawer";

interface NaacCriterionOption {
  id: string;
  number: number;
  title: string;
  inputProcessOutcome: string;
}

interface MetricOption {
  id: string;
  code: string;
  title: string;
  description: string | null;
  criterionId: string;
}

interface Club {
  id: string;
  name: string;
}

interface AcademicSectionOption {
  id: string;
  code: string;
  label: string;
  routesTo: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface PendingFile {
  id: string;
  file: File;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function RequestForm({
  user,
  editRequestId,
  initialEditData,
}: {
  user: SessionUser;
  editRequestId?: string;
  initialEditData?: {
    status: "DRAFT" | "RESEND";
    category: "ACADEMIC" | "CLUB";
    academicSectionId?: string | null;
    clubId?: string | null;
    departmentId: string;
    title: string;
    briefNote?: string | null;
    needForProposal?: string | null;
    proposalDate?: string | null;
    eventStartDate?: string | null;
    eventEndDate?: string | null;
    links?: string | null;
    naacCategory?: string | null;
    metricsCategory?: string | null;
    financialDescription?: string | null;
    expenditures?: BudgetLine[];
    receivables?: BudgetLine[];
    grandTotalExpenditure?: number | null;
    grandTotalReceivable?: number | null;
  };
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [sections, setSections] = useState<AcademicSectionOption[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [naacCriteria, setNaacCriteria] = useState<NaacCriterionOption[]>([]);
  const [metrics, setMetrics] = useState<MetricOption[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowPreviewStep[]>([]);
  const [workflowAuthorities, setWorkflowAuthorities] = useState<WorkflowAuthority[]>([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editStatus] = useState<"DRAFT" | "RESEND" | null>(initialEditData?.status ?? null);

  const [form, setForm] = useState({
    academicSectionId: initialEditData?.academicSectionId ?? "",
    departmentId: initialEditData?.departmentId ?? user.departmentId ?? "",
    title: initialEditData?.title ?? "",
    briefNote: initialEditData?.briefNote ?? "",
    needForProposal: initialEditData?.needForProposal ?? "",
    naacCriterionId: "",
    metricId: "",
    naacCategory: initialEditData?.naacCategory ?? "",
    metricsCategory: initialEditData?.metricsCategory ?? "",
    proposalDate: initialEditData?.proposalDate?.slice(0, 10) ?? "",
    eventStartDate: initialEditData?.eventStartDate?.slice(0, 10) ?? "",
    eventEndDate: initialEditData?.eventEndDate?.slice(0, 10) ?? "",
    links: initialEditData?.links ?? "",
    clubId: initialEditData?.clubId ?? "",
    financialDescription: initialEditData?.financialDescription ?? "",
  });

  const [category, setCategory] = useState<"ACADEMIC" | "CLUB">(
    initialEditData?.category ?? "ACADEMIC"
  );
  const [expenditures, setExpenditures] = useState<BudgetLine[]>(
    initialEditData?.expenditures?.length ? initialEditData.expenditures : createDefaultLines
  );
  const [receivables, setReceivables] = useState<BudgetLine[]>(
    initialEditData?.receivables?.length ? initialEditData.receivables : createDefaultLines
  );
  const [grandExp, setGrandExp] = useState(
    initialEditData?.grandTotalExpenditure != null
      ? String(initialEditData.grandTotalExpenditure)
      : ""
  );
  const [grandRec, setGrandRec] = useState(
    initialEditData?.grandTotalReceivable != null
      ? String(initialEditData.grandTotalReceivable)
      : ""
  );

  const facultyName = `${user.firstName} ${user.lastName}`;
  const departmentName = user.departmentName ?? "—";
  const needsDeptPicker = !user.departmentId;

  useEffect(() => {
    fetch("/api/master/clubs")
      .then((r) => r.json())
      .then((d) => d.success && setClubs(d.data));
    fetch("/api/master/academic-sections")
      .then((r) => r.json())
      .then((d) => d.success && setSections(d.data));
    fetch("/api/master/naac-criteria")
      .then((r) => r.json())
      .then((d) => d.success && setNaacCriteria(d.data));
    fetch("/api/master/metrics")
      .then((r) => r.json())
      .then((d) => d.success && setMetrics(d.data));
    if (needsDeptPicker) {
      fetch("/api/master/departments")
        .then((r) => r.json())
        .then((d) => d.success && setDepartments(d.data));
    }
  }, [needsDeptPicker]);

  useEffect(() => {
    const departmentId = form.departmentId || user.departmentId;
    const canPreviewAcademic = category === "ACADEMIC" && form.academicSectionId;
    const canPreviewClub = category === "CLUB" && form.clubId;

    if (!canPreviewAcademic && !canPreviewClub) {
      setWorkflowSteps([]);
      setWorkflowAuthorities([]);
      return;
    }

    let cancelled = false;
    setWorkflowLoading(true);

    const params = new URLSearchParams({ category });
    if (canPreviewAcademic) params.set("academicSectionId", form.academicSectionId);
    if (canPreviewClub) params.set("clubId", form.clubId);
    if (departmentId) params.set("departmentId", departmentId);

    fetch(`/api/workflow/preview?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) {
          setWorkflowSteps(data.data.steps ?? []);
          setWorkflowAuthorities(data.data.authorities ?? []);
        } else {
          setWorkflowSteps([]);
          setWorkflowAuthorities([]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWorkflowSteps([]);
          setWorkflowAuthorities([]);
        }
      })
      .finally(() => {
        if (!cancelled) setWorkflowLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    category,
    form.academicSectionId,
    form.clubId,
    form.departmentId,
    user.departmentId,
  ]);

  const expTotal = useMemo(() => {
    const v = parseFloat(grandExp);
    if (!Number.isNaN(v) && grandExp) return v;
    return serializeLines(expenditures).reduce(
      (s, l) => s + l.amount * l.quantity,
      0
    );
  }, [expenditures, grandExp]);

  const recTotal = useMemo(() => {
    const v = parseFloat(grandRec);
    if (!Number.isNaN(v) && grandRec) return v;
    return serializeLines(receivables).reduce(
      (s, l) => s + l.amount * l.quantity,
      0
    );
  }, [receivables, grandRec]);

  const difference = expTotal - recTotal;

  const minEventStartDate = useMemo(() => {
    if (!form.proposalDate) return undefined;
    const d = new Date(form.proposalDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, [form.proposalDate]);

  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const filteredMetrics = useMemo(
    () =>
      form.naacCriterionId
        ? metrics.filter((m) => m.criterionId === form.naacCriterionId)
        : metrics,
    [metrics, form.naacCriterionId]
  );

  function formatCriterionLabel(c: NaacCriterionOption) {
    const stage = c.inputProcessOutcome.charAt(0) + c.inputProcessOutcome.slice(1).toLowerCase();
    return `${c.number}. ${c.title} (${stage})`;
  }

  function handleCriterionChange(criterionId: string) {
    const criterion = naacCriteria.find((c) => c.id === criterionId);
    setForm((prev) => ({
      ...prev,
      naacCriterionId: criterionId,
      metricId: "",
      naacCategory: criterion ? formatCriterionLabel(criterion) : "",
      metricsCategory: "",
      financialDescription: "",
    }));
  }

  function handleMetricChange(metricId: string) {
    const metric = metrics.find((m) => m.id === metricId);
    const criterion = metric
      ? naacCriteria.find((c) => c.id === metric.criterionId)
      : undefined;
    setForm((prev) => ({
      ...prev,
      metricId,
      naacCriterionId: metric?.criterionId ?? prev.naacCriterionId,
      naacCategory: criterion ? formatCriterionLabel(criterion) : prev.naacCategory,
      metricsCategory: metric ? `${metric.code}. ${metric.title}` : "",
      financialDescription: metric?.description ?? "",
    }));
  }

  const addFiles = useCallback((files: FileList | File[]) => {
    const incoming = Array.from(files);
    const errors: string[] = [];
    const accepted: PendingFile[] = [];

    for (const file of incoming) {
      const ext = file.name.toLowerCase();
      if (!ext.endsWith(".pdf") && !ext.endsWith(".jpg") && !ext.endsWith(".jpeg") && !ext.endsWith(".png")) {
        errors.push(`${file.name}: only PDF, JPG, and PNG are allowed`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: must be under 2 MB`);
        continue;
      }
      accepted.push({ id: crypto.randomUUID(), file });
    }

    if (errors.length > 0) alert(errors.join("\n"));
    if (accepted.length > 0) {
      setPendingFiles((prev) => [...prev, ...accepted]);
    }
  }, []);

  function removeFile(id: string) {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function uploadAttachments(requestId: string) {
    for (const { file } of pendingFiles) {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`/api/requests/${requestId}/attachments`, {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error ?? `Failed to upload ${file.name}`);
      }
    }
  }

  function validateForm(submitRequest: boolean): string | null {
    if (!form.title.trim()) {
      return "Please enter a title for your proposal";
    }
    if (category === "ACADEMIC" && !form.academicSectionId) {
      return "Please select an academic section";
    }
    if (category === "CLUB" && !form.clubId) {
      return "Please select a club section";
    }
    if (needsDeptPicker && !form.departmentId) {
      return "Please select your department";
    }

    return validateRequestFormFields(
      {
        briefNote: form.briefNote,
        needForProposal: form.needForProposal,
        proposalDate: form.proposalDate,
        eventStartDate: form.eventStartDate,
        eventEndDate: form.eventEndDate,
        submit: submitRequest,
      },
      { expenditures, receivables }
    );
  }

  function buildPayload(submitRequest: boolean) {
    return {
      title: form.title,
      description: form.briefNote,
      briefNote: form.briefNote,
      needForProposal: form.needForProposal,
      proposalDate: form.proposalDate || undefined,
      eventStartDate: form.eventStartDate || undefined,
      eventEndDate: form.eventEndDate || undefined,
      links: form.links || undefined,
      naacCategory: form.naacCategory,
      metricsCategory: form.metricsCategory,
      expenditures: serializeLines(expenditures),
      receivables: serializeLines(receivables),
      grandTotalExpenditure: expTotal,
      grandTotalReceivable: recTotal,
      budgetDifference: difference,
      budgetAmount: expTotal,
      financialDescription: form.financialDescription || undefined,
      submit: submitRequest,
    };
  }

  async function submit(submitRequest: boolean) {
    const validationError = validateForm(submitRequest);
    if (validationError) {
      alert(validationError);
      return;
    }

    setLoading(true);
    try {
      if (editRequestId) {
        const patchRes = await fetch(`/api/requests/${editRequestId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload(false)),
        });
        const patchData = await patchRes.json();
        if (!patchData.success) {
          alert(patchData.error ?? "Failed to save changes");
          return;
        }

        if (pendingFiles.length > 0) {
          await uploadAttachments(editRequestId);
        }

        if (editStatus === "RESEND" && submitRequest) {
          const resubmitRes = await fetch(`/api/requests/${editRequestId}/resubmit`, {
            method: "POST",
          });
          const resubmitData = await resubmitRes.json();
          if (!resubmitData.success) {
            alert(resubmitData.error ?? "Failed to resubmit");
            return;
          }
        } else if (editStatus === "DRAFT" && submitRequest) {
          const submitRes = await fetch(`/api/requests/${editRequestId}/submit`, {
            method: "POST",
          });
          const submitData = await submitRes.json();
          if (!submitData.success) {
            alert(submitData.error ?? "Failed to submit");
            return;
          }
        }

        router.push(`/requests/${editRequestId}`);
        return;
      }

      const needsUploadBeforeSubmit = submitRequest && pendingFiles.length > 0;

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...buildPayload(needsUploadBeforeSubmit ? false : submitRequest),
          category,
          academicSectionId: category === "ACADEMIC" ? form.academicSectionId : undefined,
          departmentId: form.departmentId || undefined,
          clubId: category === "CLUB" ? form.clubId : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error ?? "Failed to save");
        return;
      }

      const requestId = data.data.id as string;

      if (pendingFiles.length > 0) {
        await uploadAttachments(requestId);
      }

      if (needsUploadBeforeSubmit) {
        const submitRes = await fetch(`/api/requests/${requestId}/submit`, { method: "POST" });
        const submitData = await submitRes.json();
        if (!submitData.success) {
          alert(
            submitData.error ??
              "Request saved as draft with documents, but submission failed. Open the request and submit again."
          );
          router.push(`/requests/${requestId}`);
          return;
        }
      }

      router.push(`/requests/${requestId}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <div className="overflow-hidden rounded-xl border border-nfa-border bg-white shadow-card">
        <div className="bg-gradient-to-r from-nfa-primary to-nfa-primary-light px-6 py-4">
          <h2 className="text-2xl font-bold text-white">Raise Request</h2>
          <p className="text-sm text-white/80">{APP_NAME} — Note For Approval</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-wrap gap-4 border-b border-nfa-border pb-4">
            {(["ACADEMIC", "CLUB"] as const).map((type) => (
              <label
                key={type}
                className={`cursor-pointer rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                  category === type
                    ? "border-nfa-primary bg-nfa-primary/5 text-nfa-primary"
                    : "border-nfa-border text-slate-600 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  checked={category === type}
                  onChange={() => setCategory(type)}
                />
                {type === "ACADEMIC" ? "Academic" : "Club"}
              </label>
            ))}
          </div>

          {category === "ACADEMIC" && (
            <div>
              <label className="nfa-label">
                Academic Section <span className="text-red-500">*</span>
              </label>
              <select
                className="nfa-input"
                value={form.academicSectionId}
                onChange={(e) =>
                  setForm({ ...form, academicSectionId: e.target.value })
                }
                required
              >
                <option value="">Select academic section</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              {(workflowLoading || workflowSteps.length > 0) && (
                <div className="mt-3 rounded-lg border border-nfa-border bg-slate-50/80 p-3">
                  {workflowLoading ? (
                    <p className="flex items-center gap-2 text-xs text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading approval flow…
                    </p>
                  ) : (
                    <WorkflowPathPreview
                      steps={workflowSteps}
                      authorities={workflowAuthorities}
                      onAuthorityClick={setSelectedUserId}
                      compact
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {category === "CLUB" && (
            <div>
              <label className="nfa-label">
                Club Section <span className="text-red-500">*</span>
              </label>
              <select
                className="nfa-input"
                value={form.clubId}
                onChange={(e) => setForm({ ...form, clubId: e.target.value })}
                required
              >
                <option value="">Select club section</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {(workflowLoading || workflowSteps.length > 0) && (
                <div className="mt-3 rounded-lg border border-nfa-border bg-slate-50/80 p-3">
                  {workflowLoading ? (
                    <p className="flex items-center gap-2 text-xs text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading approval flow…
                    </p>
                  ) : (
                    <WorkflowPathPreview
                      steps={workflowSteps}
                      authorities={workflowAuthorities}
                      onAuthorityClick={setSelectedUserId}
                      compact
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {needsDeptPicker && (
            <div>
              <label className="nfa-label">Department *</label>
              <select
                className="nfa-input"
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="nfa-label">Faculty</label>
              <p className="rounded-lg border border-nfa-border bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800">
                {facultyName}
              </p>
            </div>
            <div>
              <label className="nfa-label">Department</label>
              <p className="rounded-lg border border-nfa-border bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800">
                {departmentName}
              </p>
            </div>
            <div className="md:col-span-1">
              <label className="nfa-label">
                Brief Note Of Your Proposal <span className="text-red-500">*</span>
              </label>
              <textarea
                className="nfa-input min-h-[120px]"
                value={form.briefNote}
                onChange={(e) => setForm({ ...form, briefNote: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="nfa-label">
                Need For Proposal <span className="text-red-500">*</span>
              </label>
              <textarea
                className="nfa-input min-h-[120px]"
                value={form.needForProposal}
                onChange={(e) => setForm({ ...form, needForProposal: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="nfa-label">NAAC Criterion</label>
              <select
                className="nfa-input"
                value={form.naacCriterionId}
                onChange={(e) => handleCriterionChange(e.target.value)}
              >
                <option value="">Select NAAC criterion</option>
                {naacCriteria.map((c) => (
                  <option key={c.id} value={c.id}>
                    {formatCriterionLabel(c)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="nfa-label">Metric</label>
              <select
                className="nfa-input"
                value={form.metricId}
                onChange={(e) => handleMetricChange(e.target.value)}
              >
                <option value="">Select metric</option>
                {filteredMetrics.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code}. {m.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="nfa-label">
                Proposal Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="nfa-input"
                value={form.proposalDate}
                min={todayDate}
                onChange={(e) => setForm({ ...form, proposalDate: e.target.value })}
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Must be at least one day before the event start date.
              </p>
            </div>
            <div>
              <label className="nfa-label">
                Event Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="nfa-input"
                value={form.eventStartDate}
                min={minEventStartDate}
                onChange={(e) => setForm({ ...form, eventStartDate: e.target.value })}
                required
              />
              {form.proposalDate && (
                <p className="mt-1 text-xs text-slate-500">
                  Earliest allowed: {minEventStartDate} (one day after proposal date).
                </p>
              )}
            </div>
            <div>
              <label className="nfa-label">Event End Date</label>
              <input
                type="date"
                className="nfa-input"
                value={form.eventEndDate}
                min={form.eventStartDate || undefined}
                onChange={(e) => setForm({ ...form, eventEndDate: e.target.value })}
              />
            </div>
            <div>
              <label className="nfa-label">Title *</label>
              <input
                className="nfa-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Short title for this request"
              />
            </div>
          </div>

          <div>
            <label className="nfa-label">Supporting Documents</label>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              className="sr-only"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <div
              role="button"
              tabIndex={0}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                isDragging
                  ? "border-nfa-primary bg-nfa-primary/5"
                  : "border-nfa-border bg-slate-50/50 hover:border-nfa-primary/40"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files.length > 0) {
                  addFiles(e.dataTransfer.files);
                }
              }}
            >
              <Upload className="mx-auto h-8 w-8 text-nfa-accent" />
              <p className="mt-2 font-medium text-slate-700">Add Your Supporting Documents Here</p>
              <p className="text-sm text-slate-500">Select files or drop them here.</p>
              <button
                type="button"
                className="mt-4 rounded-lg bg-nfa-primary px-4 py-2 text-sm font-medium text-white hover:bg-nfa-primary-light"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Choose Files
              </button>
              <p className="mt-3 text-xs text-green-700">
                Accepted: PDF, JPG, PNG — max 2 MB per file.
              </p>
            </div>

            {pendingFiles.length > 0 && (
              <ul className="mt-3 space-y-2">
                {pendingFiles.map(({ id, file }) => (
                  <li
                    key={id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-nfa-border bg-white px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-nfa-primary" />
                      <span className="truncate text-sm font-medium text-slate-800">{file.name}</span>
                      <span className="shrink-0 text-xs text-slate-500">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                    <button
                      type="button"
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                      onClick={() => removeFile(id)}
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="nfa-label">Links</label>
            <input
              className="nfa-input"
              value={form.links}
              onChange={(e) => setForm({ ...form, links: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      <BudgetLineTable
        title="Expenditures"
        totalLabel="Total Expenditure"
        lines={expenditures}
        onChange={setExpenditures}
        grandTotal={grandExp}
        onGrandTotalChange={setGrandExp}
        remarksRequired
      />

      <BudgetLineTable
        title="Receivables"
        totalLabel="Total Receivables"
        lines={receivables}
        onChange={setReceivables}
        grandTotal={grandRec}
        onGrandTotalChange={setGrandRec}
        remarksRequired
      />

      <div className="nfa-card grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="nfa-label">Metric Description</label>
          <textarea
            className="nfa-input min-h-[80px]"
            value={form.financialDescription}
            onChange={(e) => setForm({ ...form, financialDescription: e.target.value })}
          />
        </div>
        <div>
          <label className="nfa-label">Difference (Expenditure − Receivables)</label>
          <input
            className="nfa-input bg-slate-50"
            readOnly
            value={`₹${difference.toLocaleString("en-IN")}`}
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-3">
        <button
          type="button"
          className="nfa-btn-secondary min-w-[120px]"
          disabled={loading}
          onClick={() => router.back()}
        >
          Cancel
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            className="nfa-btn-secondary"
            disabled={loading}
            onClick={() => submit(false)}
          >
            {editRequestId ? "Save Changes" : "Save Draft"}
          </button>
          <button
            type="button"
            className="nfa-btn-primary min-w-[120px]"
            disabled={loading || !form.title}
            onClick={() => submit(true)}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {editStatus === "RESEND"
              ? "Resubmit"
              : editRequestId
                ? "Submit"
                : "Submit"}
          </button>
        </div>
      </div>

      <UserDetailDrawer userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
    </div>
  );
}
