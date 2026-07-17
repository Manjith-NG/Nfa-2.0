"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, X, FileText, Eye } from "lucide-react";
import { AttachmentActions } from "@/components/requests/attachment-actions";
import { canPreviewAttachment } from "@/lib/download-client";
import type { SessionUser } from "@/types";
import {
  BudgetLineTable,
  createDefaultLines,
  serializeLines,
  sumBudgetLines,
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
import { ErrorDialog } from "@/components/ui/error-dialog";
import { MultiSelectList } from "@/components/ui/multi-select-list";

const MULTI_VALUE_SEPARATOR = "; ";

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
  previewUrl?: string;
}

interface SavedAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
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
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [naacLoading, setNaacLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [sectionsError, setSectionsError] = useState<string | null>(null);
  const [clubsError, setClubsError] = useState<string | null>(null);
  const [naacError, setNaacError] = useState<string | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);
  const [errorDialog, setErrorDialog] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [selectedNaacIds, setSelectedNaacIds] = useState<string[]>([]);
  const [selectedMetricIds, setSelectedMetricIds] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [savedAttachments, setSavedAttachments] = useState<SavedAttachment[]>([]);
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
    naacCategory: initialEditData?.naacCategory ?? "",
    metricsCategory: initialEditData?.metricsCategory ?? "",
    proposalDate: initialEditData?.proposalDate?.slice(0, 10) ?? "",
    eventStartDate: initialEditData?.eventStartDate?.slice(0, 10) ?? "",
    eventEndDate: initialEditData?.eventEndDate?.slice(0, 10) ?? "",
    links: initialEditData?.links ?? "",
    clubId: initialEditData?.clubId ?? "",
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

  async function fetchMaster<T>(
    url: string,
    setData: (value: T[]) => void,
    setLoadingFlag: (value: boolean) => void,
    setError: (value: string | null) => void
  ) {
    setLoadingFlag(true);
    setError(null);
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error ?? `Failed to load ${url}`);
      }
      setData(data.data ?? []);
    } catch (e) {
      setData([]);
      setError(e instanceof Error ? e.message : "Failed to load options");
    } finally {
      setLoadingFlag(false);
    }
  }

  const loadMasterData = useCallback(() => {
    void fetchMaster<Club>(
      "/api/master/clubs",
      setClubs,
      setClubsLoading,
      setClubsError
    );
    void fetchMaster<AcademicSectionOption>(
      "/api/master/academic-sections",
      setSections,
      setSectionsLoading,
      setSectionsError
    );
    void fetchMaster<NaacCriterionOption>(
      "/api/master/naac-criteria",
      setNaacCriteria,
      setNaacLoading,
      setNaacError
    );
    void fetchMaster<MetricOption>(
      "/api/master/metrics",
      setMetrics,
      setMetricsLoading,
      setMetricsError
    );
    if (needsDeptPicker) {
      setDepartmentsLoading(true);
      void fetchMaster<Department>(
        "/api/master/departments",
        setDepartments,
        setDepartmentsLoading,
        setDepartmentsError
      );
    }
  }, [needsDeptPicker]);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  useEffect(() => {
    if (!editRequestId) return;
    fetch(`/api/requests/${editRequestId}/attachments`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSavedAttachments(d.data);
      });
  }, [editRequestId]);

  useEffect(() => {
    return () => {
      pendingFiles.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [pendingFiles]);

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
    if (!Number.isNaN(v) && grandExp.trim() !== "") return v;
    return sumBudgetLines(expenditures);
  }, [expenditures, grandExp]);

  const recTotal = useMemo(() => {
    const v = parseFloat(grandRec);
    if (!Number.isNaN(v) && grandRec.trim() !== "") return v;
    return sumBudgetLines(receivables);
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
      selectedNaacIds.length > 0
        ? metrics.filter((m) => selectedNaacIds.includes(m.criterionId))
        : metrics,
    [metrics, selectedNaacIds]
  );

  function formatCriterionLabel(c: NaacCriterionOption) {
    const stage = c.inputProcessOutcome.charAt(0) + c.inputProcessOutcome.slice(1).toLowerCase();
    return `${c.number}. ${c.title} (${stage})`;
  }

  function formatMetricLabel(metric: MetricOption) {
    const desc = metric.description?.trim();
    return desc ? `${metric.code}. ${metric.title} — ${desc}` : `${metric.code}. ${metric.title}`;
  }

  function syncNaacCategory(ids: string[]) {
    const labels = ids
      .map((id) => naacCriteria.find((c) => c.id === id))
      .filter(Boolean)
      .map((c) => formatCriterionLabel(c!));
    setForm((prev) => ({ ...prev, naacCategory: labels.join(MULTI_VALUE_SEPARATOR) }));
  }

  function syncMetricsCategory(ids: string[]) {
    const labels = ids
      .map((id) => metrics.find((m) => m.id === id))
      .filter(Boolean)
      .map((m) => formatMetricLabel(m!));
    setForm((prev) => ({ ...prev, metricsCategory: labels.join(MULTI_VALUE_SEPARATOR) }));
  }

  function toggleNaacCriterion(criterionId: string) {
    setSelectedNaacIds((prev) => {
      const next = prev.includes(criterionId)
        ? prev.filter((id) => id !== criterionId)
        : [...prev, criterionId];
      syncNaacCategory(next);

      setSelectedMetricIds((metricPrev) => {
        const validMetrics = metricPrev.filter((metricId) => {
          const metric = metrics.find((m) => m.id === metricId);
          return metric && next.includes(metric.criterionId);
        });
        syncMetricsCategory(validMetrics);
        return validMetrics;
      });

      return next;
    });
  }

  function toggleMetric(metricId: string) {
    setSelectedMetricIds((prev) => {
      const next = prev.includes(metricId)
        ? prev.filter((id) => id !== metricId)
        : [...prev, metricId];
      syncMetricsCategory(next);
      return next;
    });
  }

  useEffect(() => {
    if (!initialEditData?.naacCategory || naacCriteria.length === 0) return;
    const parts = initialEditData.naacCategory.split(MULTI_VALUE_SEPARATOR).map((s) => s.trim());
    const ids = parts
      .map((part) => naacCriteria.find((c) => formatCriterionLabel(c) === part)?.id)
      .filter((id): id is string => Boolean(id));
    if (ids.length > 0) setSelectedNaacIds(ids);
  }, [initialEditData?.naacCategory, naacCriteria]);

  useEffect(() => {
    if (!initialEditData?.metricsCategory || metrics.length === 0) return;
    const parts = initialEditData.metricsCategory.split(MULTI_VALUE_SEPARATOR).map((s) => s.trim());
    const ids = parts
      .map((part) => metrics.find((m) => formatMetricLabel(m) === part)?.id)
      .filter((id): id is string => Boolean(id));
    if (ids.length > 0) setSelectedMetricIds(ids);
  }, [initialEditData?.metricsCategory, metrics]);

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
      accepted.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: canPreviewAttachment(file.type, file.name)
          ? URL.createObjectURL(file)
          : undefined,
      });
    }

    if (errors.length > 0) alert(errors.join("\n"));
    if (accepted.length > 0) {
      setPendingFiles((prev) => [...prev, ...accepted]);
    }
  }, []);

  function removeFile(id: string) {
    setPendingFiles((prev) => {
      const removed = prev.find((f) => f.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }

  function viewPendingFile(item: PendingFile) {
    if (!item.previewUrl) return;
    const opened = window.open(item.previewUrl, "_blank", "noopener,noreferrer");
    if (!opened) alert("Pop-up blocked. Allow pop-ups to view the document.");
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
      submit: submitRequest,
    };
  }

  function showError(message: string) {
    setErrorDialog(message);
  }

  async function submit(submitRequest: boolean) {
    const validationError = validateForm(submitRequest);
    if (validationError) {
      showError(validationError);
      return;
    }

    if (submitRequest) {
      const actionLabel = editStatus === "RESEND" ? "resubmit" : "submit";
      const confirmed = window.confirm(
        `Are you sure you want to ${actionLabel} this request?\n\nOnce submitted, it will enter the approval workflow. You may not be able to edit it until it is sent back for corrections.`
      );
      if (!confirmed) return;
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
          showError(patchData.error ?? "Failed to save changes");
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
            showError(resubmitData.error ?? "Failed to resubmit");
            return;
          }
          router.push(`/requests/${editRequestId}`);
          return;
        }

        if (editStatus === "DRAFT" && submitRequest) {
          const submitRes = await fetch(`/api/requests/${editRequestId}/submit`, {
            method: "POST",
          });
          const submitData = await submitRes.json();
          if (!submitData.success) {
            showError(submitData.error ?? "Failed to submit");
            return;
          }
          router.push(`/requests/${editRequestId}`);
          return;
        }

        setSaveMessage("Draft saved successfully.");
        router.push(`/requests/${editRequestId}/edit`);
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
        showError(data.error ?? "Failed to save");
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
          showError(
            submitData.error ??
              "Request saved as draft with documents, but submission failed. Open the draft and submit again."
          );
          router.push(`/requests/${requestId}/edit`);
          return;
        }
        router.push(`/requests/${requestId}`);
        return;
      }

      if (submitRequest) {
        router.push(`/requests/${requestId}`);
      } else {
        router.push(`/requests/${requestId}/edit`);
      }
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <div className="overflow-hidden rounded-xl border border-nfa-border bg-white shadow-card">
        <div className="bg-gradient-to-r from-nfa-primary to-nfa-primary-light px-4 py-4 sm:px-6">
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            {editRequestId
              ? editStatus === "RESEND"
                ? "Edit & Resubmit Request"
                : "Edit Draft Request"
              : "Raise Request"}
          </h2>
          <p className="text-sm text-white/80">{APP_NAME} — Note For Approval</p>
        </div>

        <div className="space-y-6 p-4 sm:p-6">
          {saveMessage && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {saveMessage}
            </div>
          )}

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
                disabled={sectionsLoading || Boolean(sectionsError)}
                required
              >
                <option value="">
                  {sectionsLoading
                    ? "Loading academic sections..."
                    : sectionsError
                      ? "Could not load academic sections"
                      : "Select academic section"}
                </option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              {sectionsError && (
                <button
                  type="button"
                  onClick={loadMasterData}
                  className="mt-2 text-sm font-medium text-nfa-primary hover:underline"
                >
                  Retry loading sections
                </button>
              )}
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
                disabled={clubsLoading || Boolean(clubsError)}
                required
              >
                <option value="">
                  {clubsLoading
                    ? "Loading club sections..."
                    : clubsError
                      ? "Could not load club sections"
                      : "Select club section"}
                </option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {clubsError && (
                <button
                  type="button"
                  onClick={loadMasterData}
                  className="mt-2 text-sm font-medium text-nfa-primary hover:underline"
                >
                  Retry loading clubs
                </button>
              )}
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
                disabled={departmentsLoading || Boolean(departmentsError)}
              >
                <option value="">
                  {departmentsLoading
                    ? "Loading departments..."
                    : departmentsError
                      ? "Could not load departments"
                      : "Select department"}
                </option>
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
              <MultiSelectList
                label="NAAC Criterion"
                options={naacCriteria.map((c) => ({
                  id: c.id,
                  label: formatCriterionLabel(c),
                }))}
                selectedIds={selectedNaacIds}
                onToggle={toggleNaacCriterion}
                loading={naacLoading}
                error={naacError}
                onRetry={loadMasterData}
                emptyMessage="No NAAC criteria available"
              />
            </div>
            <div>
              <MultiSelectList
                label="Metric"
                options={filteredMetrics.map((m) => ({
                  id: m.id,
                  label: `${m.code}. ${m.title}`,
                  hint: m.description ?? undefined,
                }))}
                selectedIds={selectedMetricIds}
                onToggle={toggleMetric}
                loading={metricsLoading}
                error={metricsError}
                onRetry={loadMasterData}
                emptyMessage={
                  selectedNaacIds.length > 0
                    ? "No metrics for the selected NAAC criteria"
                    : "No metrics available"
                }
              />
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

            {editRequestId && savedAttachments.length > 0 && (
              <ul className="mt-3 space-y-2">
                <p className="text-xs font-medium text-slate-500">Already attached</p>
                {savedAttachments.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-nfa-border bg-white px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-nfa-primary" />
                      <span className="truncate text-sm font-medium text-slate-800">{file.fileName}</span>
                      <span className="shrink-0 text-xs text-slate-500">
                        ({formatFileSize(file.fileSize)})
                      </span>
                    </div>
                    <AttachmentActions requestId={editRequestId} file={file} compact />
                  </li>
                ))}
              </ul>
            )}

            {pendingFiles.length > 0 && (
              <ul className="mt-3 space-y-2">
                {pendingFiles.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-nfa-border bg-white px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-nfa-primary" />
                      <span className="truncate text-sm font-medium text-slate-800">{item.file.name}</span>
                      <span className="shrink-0 text-xs text-slate-500">
                        ({formatFileSize(item.file.size)})
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {canPreviewAttachment(item.file.type, item.file.name) && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-nfa-primary hover:bg-nfa-primary/10"
                          onClick={() => viewPendingFile(item)}
                          title="View document"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      )}
                      <button
                        type="button"
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                        onClick={() => removeFile(item.id)}
                        aria-label={`Remove ${item.file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
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
      />

      <BudgetLineTable
        title="Receivables"
        totalLabel="Total Receivables"
        lines={receivables}
        onChange={setReceivables}
        grandTotal={grandRec}
        onGrandTotalChange={setGrandRec}
      />

      <div className="nfa-card grid gap-4 sm:grid-cols-2">
        <div>
          <label className="nfa-label">Difference (Expenditure − Receivables)</label>
          <input
            className="nfa-input bg-slate-50 text-slate-700"
            readOnly
            tabIndex={-1}
            aria-readonly="true"
            value={`Rs. ${difference.toLocaleString("en-IN")}`}
          />
          <p className="mt-1 text-xs text-slate-500">
            Calculated automatically when you enter expenditure and receivable amounts.
          </p>
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

      {errorDialog && <ErrorDialog message={errorDialog} onClose={() => setErrorDialog(null)} />}
    </div>
  );
}
