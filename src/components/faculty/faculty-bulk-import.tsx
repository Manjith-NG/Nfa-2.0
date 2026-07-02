"use client";

import { useRef, useState } from "react";
import { Download, FileUp, Loader2 } from "lucide-react";
import type { FacultyImportRowResult } from "@/lib/faculty/faculty-import";

export function FacultyBulkImport() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FacultyImportRowResult[] | null>(null);
  const [summary, setSummary] = useState<{ total: number; created: number; failed: number } | null>(
    null
  );

  async function downloadTemplate() {
    const res = await fetch("/api/users/import-template");
    if (!res.ok) {
      alert("Could not download template");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "faculty-import-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleFile(file: File) {
    setLoading(true);
    setResults(null);
    setSummary(null);

    const csv = await file.text();
    const res = await fetch("/api/users/bulk-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv }),
    });
    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      alert(data.error ?? "Import failed");
      return;
    }

    setSummary({
      total: data.data.total,
      created: data.data.created,
      failed: data.data.failed,
    });
    setResults(data.data.results);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dashed border-nfa-border bg-slate-50/80 p-4">
        <h3 className="font-semibold text-slate-900">Bulk import template</h3>
        <p className="mt-1 text-sm text-slate-600">
          Download the CSV template, fill one row per faculty member, then upload it here. Use
          department codes such as <code className="text-xs">CS</code>,{" "}
          <code className="text-xs">PHY</code>, designation <code className="text-xs">FACULTY</code>,
          and position <code className="text-xs">ASST_PROFESSOR</code>.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={downloadTemplate} className="nfa-btn-secondary inline-flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download CSV template
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="nfa-btn-primary inline-flex items-center gap-2"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            Upload filled CSV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {summary && (
        <div className="nfa-card text-sm text-slate-700">
          <p>
            Imported <strong>{summary.created}</strong> of <strong>{summary.total}</strong> rows
            {summary.failed > 0 ? (
              <>
                {" "}
                — <span className="text-red-600">{summary.failed} failed</span>
              </>
            ) : null}
            .
          </p>
        </div>
      )}

      {results && results.some((r) => !r.success) && (
        <div className="nfa-card overflow-hidden p-0">
          <div className="border-b border-nfa-border px-4 py-3 text-sm font-semibold text-slate-900">
            Import errors
          </div>
          <ul className="divide-y divide-nfa-border text-sm">
            {results
              .filter((r) => !r.success)
              .map((r) => (
                <li key={`${r.row}-${r.email}`} className="px-4 py-2 text-slate-600">
                  Row {r.row} ({r.email}): {r.error}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
