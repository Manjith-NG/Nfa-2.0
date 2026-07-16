"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { downloadFromApi } from "@/lib/download-client";
import type { VerifiedReportFormat, VerifiedReportPeriod } from "@/lib/reports/verified-report-options";
import {
  verifiedReportFormatLabel,
  verifiedReportPeriodLabel,
} from "@/lib/reports/verified-report-options";

const PERIOD_OPTIONS: VerifiedReportPeriod[] = ["daily", "weekly", "monthly", "all"];
const FORMAT_OPTIONS: VerifiedReportFormat[] = ["csv", "summary"];

export function VerifiedReportExport() {
  const [period, setPeriod] = useState<VerifiedReportPeriod>("monthly");
  const [format, setFormat] = useState<VerifiedReportFormat>("csv");
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      const periodSlug = period === "all" ? "all" : period;
      const fallback =
        format === "summary"
          ? `nfa-short-summaries-${periodSlug}-${stamp}.pdf`
          : `nfa-verified-${periodSlug}-${stamp}.csv`;

      await downloadFromApi(
        `/api/requests/export/verified?period=${period}&format=${format}`,
        fallback
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Download failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="min-w-0">
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
        </div>

        <div className="min-w-0">
          <label htmlFor="report-format" className="mb-1.5 block text-sm font-medium text-slate-700">
            Download format
          </label>
          <select
            id="report-format"
            value={format}
            onChange={(e) => setFormat(e.target.value as VerifiedReportFormat)}
            className="nfa-input w-full"
            disabled={loading}
          >
            {FORMAT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {verifiedReportFormatLabel(option)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        {format === "summary"
          ? "Downloads one combined PDF with a short report page per verified request in the selected period (max 50 requests)."
          : "Downloads a CSV of verified requests with section, dates, expenditure, and authority remarks."}
      </p>

      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="nfa-btn-primary inline-flex w-full justify-center sm:w-auto"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {format === "summary" ? "Download Short Summary PDF" : "Download CSV"}
      </button>
    </div>
  );
}
