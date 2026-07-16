import Link from "next/link";
import { FileSpreadsheet, Download } from "lucide-react";
import { requirePermission } from "@/lib/session";
import { VerifiedReportExport } from "@/components/reports/verified-report-export";

export default async function ReportsPage() {
  await requirePermission("reports:view");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Reports & Downloads</h2>
        <p className="text-slate-500">
          Export verified requests after awaiting final clearance
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="nfa-card space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-nfa-primary/10 text-nfa-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Approved requests report</h3>
              <p className="mt-1 text-sm text-slate-500">
                Export verified requests as a detailed CSV or as short summary PDFs for
                the selected daily, weekly, or monthly period.
              </p>
            </div>
          </div>
          <VerifiedReportExport />
        </div>

        <div className="nfa-card space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Per-request PDFs</h3>
              <p className="mt-1 text-sm text-slate-500">
                Open any verified request to download a short report or full approval
                certificate with section, event dates, timestamps, and authority remarks.
              </p>
            </div>
          </div>
          <Link href="/requests" className="nfa-btn-secondary inline-flex">
            Browse requests
          </Link>
        </div>
      </div>

      <div className="nfa-card">
        <h3 className="font-semibold text-slate-900">Export includes</h3>
        <ul className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          <li>Request number and title</li>
          <li>Academic section and department</li>
          <li>Submitted and verified (OFC) timestamps</li>
          <li>Event date and event period</li>
          <li>Total expenditure</li>
          <li>Remarks from each approving authority</li>
        </ul>
      </div>
    </div>
  );
}
