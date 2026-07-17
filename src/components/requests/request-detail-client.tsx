"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ApprovalTimeline } from "@/components/ui/approval-timeline";
import { StatusBadge } from "@/components/ui/status-badge";
import { Bone } from "@/components/ui/page-skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { RequestDetailData } from "@/lib/services/request-detail-service";
import { downloadFromApi } from "@/lib/download-client";
import { AttachmentActions } from "@/components/requests/attachment-actions";
import { validateApprovalRemarks } from "@/lib/request-validation";
import { ErrorDialog } from "@/components/ui/error-dialog";
import { Download, Loader2, FileText, Upload, Paperclip } from "lucide-react";
import type { RoleCode } from "@prisma/client";

const RequestWorkflowPanel = dynamic(
  () =>
    import("@/components/requests/request-workflow-panel").then(
      (m) => m.RequestWorkflowPanel
    ),
  {
    loading: () => <Bone className="h-28 w-full rounded-xl" />,
  }
);

export function RequestDetailClient({
  id,
  initialData,
  viewerRole,
}: {
  id: string;
  initialData: RequestDetailData;
  viewerRole?: RoleCode;
}) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<"summary" | "full" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorDialog, setErrorDialog] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function handleUploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch(`/api/requests/${id}/attachments`, { method: "POST", body });
        const result = await res.json();
        if (!result.success) {
          throw new Error(result.error ?? `Failed to upload ${file.name}`);
        }
      }
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDownload(type: "summary" | "full") {
    setDownloading(type);
    try {
      const suffix = type === "summary" ? "short-report.pdf" : "approval.pdf";
      await downloadFromApi(`/api/requests/${id}/pdf?type=${type}`, `${data.requestNumber}-${suffix}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(null);
    }
  }

  async function refresh() {
    const res = await fetch(`/api/requests/${id}`);
    const d = await res.json();
    if (d.success) setData(d.data);
    router.refresh();
  }

  async function handleSubmitDraft() {
    const confirmed = window.confirm(
      "Submit this draft for approval?\n\nOnce submitted, it will enter the approval workflow."
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${id}/submit`, { method: "POST" });
      const result = await res.json();
      if (!result.success) {
        setErrorDialog(result.error ?? "Failed to submit draft");
        return;
      }
      router.refresh();
      await refresh();
    } catch (e) {
      setErrorDialog(e instanceof Error ? e.message : "Failed to submit draft");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: "APPROVE" | "REJECT" | "RESEND") {
    const remarksError = validateApprovalRemarks(remarks);
    if (remarksError) {
      alert(remarksError);
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/requests/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, remarks: remarks || undefined }),
    });
    const result = await res.json();
    setLoading(false);
    if (result.success) {
      if (action === "APPROVE" && viewerRole && viewerRole !== "REGISTRAR" && viewerRole !== "OFC") {
        const res = await fetch(`/api/requests/${id}`);
        const d = await res.json();
        if (d.success) {
          setData(d.data);
          setRemarks("");
          if (!d.data.canApprove) {
            router.push("/approvals");
            return;
          }
        } else {
          router.push("/approvals");
          return;
        }
      } else {
        router.refresh();
        await refresh();
        setRemarks("");
      }
    } else {
      alert(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-nfa-primary">{data.requestNumber}</p>
          <h2 className="text-2xl font-semibold text-slate-900">{data.title}</h2>
          <p className="mt-1 text-slate-500">
            {data.raisedByName} · {data.department.name}
            {data.club && ` · ${data.club.name}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={data.status} currentRoleCode={data.currentRoleCode} />
        </div>
      </div>

      {(data.canDownloadSummary || data.canDownloadPdf || data.status !== "DRAFT") && (
        <div className="nfa-card space-y-4">
          <div>
            <h3 className="font-semibold text-slate-900">Documents &amp; PDFs</h3>
            <p className="mt-1 text-sm text-slate-500">
              {data.canDownloadSummary ? (
                <>
                  <strong>Short Report</strong> — one-page overview for quick review.{" "}
                  <strong>Full Certificate</strong> — complete approval record after OFC verification.
                </>
              ) : (
                <>
                  <strong>Full Certificate</strong> — complete approval record after OFC verification.
                </>
              )}
            </p>
          </div>
          <div
            className={`grid gap-3 ${data.canDownloadSummary ? "sm:grid-cols-2" : ""}`}
          >
            {data.canDownloadSummary && (
              <button
                type="button"
                onClick={() => handleDownload("summary")}
                disabled={downloading !== null}
                className="flex items-start gap-3 rounded-xl border-2 border-nfa-primary/30 bg-nfa-primary/5 p-4 text-left hover:border-nfa-primary disabled:opacity-60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-nfa-primary text-white">
                  {downloading === "summary" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-nfa-primary">Short Report PDF</p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Title, dates, budget totals, and current status on one page.
                  </p>
                </div>
              </button>
            )}
            {data.canDownloadPdf ? (
              <button
                type="button"
                onClick={() => handleDownload("full")}
                disabled={downloading !== null}
                className="flex items-start gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4 text-left hover:border-emerald-400 disabled:opacity-60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  {downloading === "full" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Download className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-emerald-800">Full Approval Certificate</p>
                  <p className="mt-0.5 text-xs text-emerald-700">
                    Every approver, remarks, and budget lines — after Verified status.
                  </p>
                </div>
              </button>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-400">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-500">Full Approval Certificate</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Unlocks after OFC final clearance (Verified).
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {data.status === "DRAFT" && data.canEdit && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Draft — not submitted yet</p>
          <p className="mt-1 text-amber-900">
            This request is saved in My Requests as a draft. Edit it anytime, then submit when you are ready.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/requests/${id}/edit`}
              className="inline-flex rounded-lg border border-amber-400 bg-white px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
            >
              Edit Draft
            </Link>
            {data.canSubmitDraft && (
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmitDraft}
                className="inline-flex rounded-lg bg-nfa-primary px-4 py-2 text-sm font-medium text-white hover:bg-nfa-primary-light disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Request"}
              </button>
            )}
          </div>
        </div>
      )}

      {data.resendInfo && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
          <p className="font-semibold">
            Sent back for {data.resendInfo.actionLabel.toLowerCase()} by {data.resendInfo.roleName}
          </p>
          {data.resendInfo.remarks && (
            <p className="mt-1 text-yellow-800">{data.resendInfo.remarks}</p>
          )}
          <p className="mt-2 text-yellow-800">
            Edit your request and resubmit. It will return to {data.resendInfo.roleName} for review.
          </p>
          {data.canEdit && (
            <Link
              href={`/requests/${id}/edit`}
              className="mt-3 inline-block rounded-lg bg-yellow-700 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-800"
            >
              Edit & Resubmit
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="nfa-card">
            <h3 className="mb-4 font-semibold">Request Details</h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">Category</dt>
                <dd className="font-medium">{data.category}</dd>
              </div>
              {data.academicSectionLabel && (
                <div>
                  <dt className="text-xs text-slate-500">Academic Section</dt>
                  <dd className="font-medium">{data.academicSectionLabel}</dd>
                </div>
              )}
              {data.club && (
                <div>
                  <dt className="text-xs text-slate-500">Club Section</dt>
                  <dd className="font-medium">{data.club.name}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-slate-500">Proposal Date</dt>
                <dd className="font-medium">
                  {data.proposalDate ? formatDate(data.proposalDate) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Event Start</dt>
                <dd className="font-medium">
                  {data.eventStartDate ? formatDate(data.eventStartDate) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Event End</dt>
                <dd className="font-medium">
                  {data.eventEndDate ? formatDate(data.eventEndDate) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Budget</dt>
                <dd className="font-medium">{formatCurrency(data.budgetAmount)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-500">Brief Note</dt>
                <dd className="whitespace-pre-wrap">{data.briefNote ?? data.description ?? "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-500">Need For Proposal</dt>
                <dd className="whitespace-pre-wrap">{data.needForProposal ?? "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="nfa-card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold">Supporting Documents</h3>
              {data.canUploadAttachments && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    className="sr-only"
                    onChange={(e) => handleUploadFiles(e.target.files)}
                  />
                  <button
                    type="button"
                    className="nfa-btn-secondary py-1.5 text-xs"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    Upload
                  </button>
                </>
              )}
            </div>
            {data.attachments.length === 0 ? (
              <p className="text-sm text-slate-500">No supporting documents attached.</p>
            ) : (
              <ul className="divide-y divide-nfa-border rounded-lg border border-nfa-border">
                {data.attachments.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Paperclip className="h-4 w-4 shrink-0 text-nfa-primary" />
                      <span className="truncate text-sm font-medium">{file.fileName}</span>
                      <span className="shrink-0 text-xs text-slate-500">
                        ({formatFileSize(file.fileSize)})
                      </span>
                    </div>
                    <AttachmentActions requestId={id} file={file} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {(data.canManageWorkflow || data.canForward) && data.workflowSteps && (
            <RequestWorkflowPanel
              requestId={id}
              currentSteps={data.workflowSteps}
              canManageWorkflow={data.canManageWorkflow}
              canForward={data.canForward}
              onUpdated={refresh}
            />
          )}

          {data.canApprove && (
            <div className="nfa-card border-2 border-nfa-primary/20">
              <h3 className="mb-4 font-semibold">Approval Actions</h3>
              <textarea
                className="nfa-input mb-4 min-h-[80px]"
                placeholder="Remarks (required)"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                required
              />
              <div className="flex flex-wrap gap-2">
                <button
                  className="nfa-btn-primary bg-emerald-600 hover:bg-emerald-700"
                  disabled={loading}
                  onClick={() => handleAction("APPROVE")}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
                </button>
                <button
                  className="nfa-btn-secondary border-yellow-300 text-yellow-800 hover:bg-yellow-50"
                  disabled={loading}
                  onClick={() => handleAction("RESEND")}
                >
                  Resend / Recheck
                </button>
                <button
                  className="nfa-btn-secondary border-red-200 text-red-700 hover:bg-red-50"
                  disabled={loading}
                  onClick={() => handleAction("REJECT")}
                >
                  Reject
                </button>
              </div>
            </div>
          )}

        </div>

        <div className="nfa-card lg:sticky lg:top-20 lg:self-start">
          <h3 className="mb-6 font-semibold">
            {data.status === "DRAFT" ? "Draft Status" : "Approval Tracking"}
          </h3>
          {data.status === "DRAFT" ? (
            <p className="text-sm text-slate-500">
              Submit this draft to start the approval workflow. Until then, it stays in My Requests as a draft.
            </p>
          ) : (
            <ApprovalTimeline steps={data.timeline} requestNumber={data.requestNumber} />
          )}
        </div>
      </div>

      {errorDialog && (
        <ErrorDialog message={errorDialog} onClose={() => setErrorDialog(null)} />
      )}
    </div>
  );
}
