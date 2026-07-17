"use client";

import { AlertCircle, X } from "lucide-react";

export function ErrorDialog({
  title = "Something went wrong",
  message,
  onClose,
}: {
  title?: string;
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="error-dialog-title"
    >
      <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 id="error-dialog-title" className="text-base font-semibold text-slate-900">
                {title}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{message}</p>
            <button type="button" onClick={onClose} className="nfa-btn-primary mt-4 w-full">
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
