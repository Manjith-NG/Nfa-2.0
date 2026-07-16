"use client";

import { useState } from "react";
import { Download, Eye, Loader2 } from "lucide-react";
import {
  canPreviewAttachment,
  downloadFromApi,
  requestAttachmentUrl,
  viewFromApi,
} from "@/lib/download-client";

type AttachmentFile = {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
};

export function AttachmentActions({
  requestId,
  file,
  compact = false,
}: {
  requestId: string;
  file: AttachmentFile;
  compact?: boolean;
}) {
  const [viewing, setViewing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const canView = canPreviewAttachment(file.mimeType, file.fileName);
  const url = requestAttachmentUrl(requestId, file.id);

  async function handleView() {
    setViewing(true);
    try {
      await viewFromApi(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not open file");
    } finally {
      setViewing(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadFromApi(url, file.fileName);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className={`flex shrink-0 items-center ${compact ? "gap-1" : "gap-2"}`}>
      {canView && (
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-nfa-primary hover:bg-nfa-primary/10 disabled:opacity-50"
          onClick={handleView}
          disabled={viewing || downloading}
          title="View document"
        >
          {viewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
          View
        </button>
      )}
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
        onClick={handleDownload}
        disabled={viewing || downloading}
        title="Download document"
      >
        {downloading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        Download
      </button>
    </div>
  );
}
