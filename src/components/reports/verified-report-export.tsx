"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { downloadFromApi } from "@/lib/download-client";
import type { VerifiedReportPeriod } from "@/lib/services/request-export-service";
import { verifiedReportPeriodLabel } from "@/lib/services/request-export-service";

const PERIOD_OPTIONS: VerifiedReportPeriod[] = ["daily", "weekly", "monthly", "all"];

export function VerifiedReportExport() {
  const [period, setPeriod] = useState<VerifiedReportPeriod>("monthly");
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      await downloadFromApi(
        `/api/requests/export/verified?period=${period}`,
        `nfa-verified-${period}-${stamp}.csv`
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Download failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1">
        <label htmlFor="report-period" className="mb-1.5 block text-sm font-medium text-slate-700">
          Approved report period
        </label>
        <select
          id="report-period"
          value={period}
          onChange={(e) => setPeriod(e.target.value as VerifiedReportPeriod)}
          className="nfa-input w-full"
          disabled={loading}
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {verifiedReportPeriodLabel(option)}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-slate-500">
          Downloads verified (OFC-cleared) requests approved in the selected period.
        </p>
      </div>
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="nfa-btn-primary inline-flex w-full shrink-0 justify-center sm:w-auto"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Download CSV
      </button>
    </div>
  );
}
