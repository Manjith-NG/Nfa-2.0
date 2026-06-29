"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { downloadFromApi } from "@/lib/download-client";

export function DownloadCsvButton() {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      await downloadFromApi("/api/requests/export/verified", "nfa-verified-requests.csv");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Download failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="nfa-btn-primary inline-flex w-full justify-center sm:w-auto"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Download verified requests (CSV)
    </button>
  );
}
