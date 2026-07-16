"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ROLE_LABELS } from "@/lib/constants";
import { CONFIGURABLE_WORKFLOW_ROLES } from "@/lib/workflow/resolve";
import type { RoleCode } from "@prisma/client";

export function RequestWorkflowPanel({
  requestId,
  currentSteps,
  canManageWorkflow,
  canForward,
  onUpdated,
}: {
  requestId: string;
  currentSteps: { roleCode: RoleCode; stepLabel: string }[];
  canManageWorkflow?: boolean;
  canForward?: boolean;
  onUpdated: () => void;
}) {
  const [steps, setSteps] = useState<RoleCode[]>(
    currentSteps
      .filter((s) => !["REGISTRAR", "OFC"].includes(s.roleCode))
      .map((s) => s.roleCode)
  );
  const [loading, setLoading] = useState(false);

  if (!canManageWorkflow && !canForward) return null;

  async function saveWorkflow() {
    setLoading(true);
    const res = await fetch(`/api/requests/${requestId}/workflow`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steps }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) onUpdated();
    else alert(data.error ?? "Failed to update workflow");
  }

  async function forwardTo(targetRole: RoleCode) {
    setLoading(true);
    const res = await fetch(`/api/requests/${requestId}/forward`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetRole }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) onUpdated();
    else alert(data.error ?? "Failed to forward request");
  }

  return (
    <div className="nfa-card border-2 border-nfa-accent/20 space-y-4">
      <div>
        <h3 className="font-semibold text-slate-900">Registrar flow control</h3>
        <p className="text-sm text-slate-500">
          Configure this request&apos;s approval path or forward it to HR / COE.
        </p>
      </div>

      {canManageWorkflow && (
        <>
          <div className="flex flex-wrap gap-2">
            {CONFIGURABLE_WORKFLOW_ROLES.filter((r) => r !== "REGISTRAR").map((role) => (
              <button
                key={role}
                type="button"
                onClick={() =>
                  setSteps((prev) =>
                    prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
                  )
                }
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  steps.includes(role)
                    ? "border-nfa-primary bg-nfa-primary/10 text-nfa-primary"
                    : "border-nfa-border text-slate-600"
                }`}
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </div>
          <button type="button" className="nfa-btn-primary" disabled={loading} onClick={saveWorkflow}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Apply workflow to request
          </button>
        </>
      )}

      {canForward && (
        <div className="flex flex-wrap gap-2 border-t border-nfa-border pt-4">
          <span className="w-full text-sm font-medium text-slate-700">Forward to:</span>
          {(["HR", "COE", "IQAC", "PMSEB"] as RoleCode[]).map((role) => (
            <button
              key={role}
              type="button"
              className="nfa-btn-secondary"
              disabled={loading}
              onClick={() => forwardTo(role)}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
